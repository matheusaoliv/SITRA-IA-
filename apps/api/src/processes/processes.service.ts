import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProcessStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { canAccessOrganization, canCreateProcessInOrganization, canUpdateProcessInOrganization } from '../auth/authorization.policy';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';
import { canTransition, NEXT_STATUS } from './process-status';

function parseViolationDate(value?: string) {
  if (!value) return undefined;
  return new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
}

const organizationSummary = { select: { id: true, name: true, code: true } } as const;

@Injectable()
export class ProcessesService {
  constructor(private readonly prisma: PrismaService) {}

  private assertOrganizationAccess(organizationId: string, actor: AuthenticatedUser) {
    if (!canAccessOrganization(actor, organizationId)) {
      throw new NotFoundException('Processo não encontrado.');
    }
  }

  async create(dto: CreateProcessDto, actor: AuthenticatedUser) {
    this.assertOrganizationAccess(dto.organizationId, actor);
    if (!canCreateProcessInOrganization(actor, dto.organizationId)) {
      throw new ForbiddenException('Seu perfil não permite protocolar processos neste órgão.');
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const process = await tx.process.create({
          data: {
            protocolNumber: dto.protocolNumber,
            type: dto.type,
            organizationId: dto.organizationId,
            applicantName: dto.applicantName,
            infractionNoticeNumber: dto.infractionNoticeNumber || null,
            violationDate: parseViolationDate(dto.violationDate),
            subject: dto.subject || null,
          },
          include: { organization: organizationSummary },
        });
        await tx.auditLog.create({
          data: {
            processId: process.id, actorId: actor.id, action: 'PROCESS_CREATED',
            entityType: 'Process', entityId: process.id,
            metadata: { protocolNumber: process.protocolNumber, type: process.type, organizationId: process.organizationId },
          },
        });
        return process;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um processo com este número de protocolo neste órgão.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Órgão informado não encontrado.');
      }
      throw error;
    }
  }

  async findAll(filters: { organizationId?: string; status?: ProcessStatus; search?: string; page?: number; limit?: number }, actor: AuthenticatedUser) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    let organizationFilter: Prisma.StringFilter | undefined;
    if (actor.isSystemAdmin) {
      if (filters.organizationId) organizationFilter = { equals: filters.organizationId };
    } else {
      const ids = actor.memberships.map((item) => item.organizationId);
      if (filters.organizationId) {
        this.assertOrganizationAccess(filters.organizationId, actor);
        organizationFilter = { equals: filters.organizationId };
      } else {
        organizationFilter = { in: ids };
      }
    }
    const where: Prisma.ProcessWhereInput = {
      ...(organizationFilter ? { organizationId: organizationFilter } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? { OR: [
        { protocolNumber: { contains: filters.search, mode: 'insensitive' } },
        { applicantName: { contains: filters.search, mode: 'insensitive' } },
        { infractionNoticeNumber: { contains: filters.search, mode: 'insensitive' } },
      ] } : {}),
    };
    const { status: _status, ...whereWithoutStatus } = where;
    const [items, total, byStatus] = await this.prisma.$transaction([
      this.prisma.process.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { organization: organizationSummary },
      }),
      this.prisma.process.count({ where }),
      this.prisma.process.groupBy({ by: ['status'], where: whereWithoutStatus, orderBy: { status: 'asc' }, _count: { _all: true } }),
    ]);
    const statusCounts = Object.fromEntries(byStatus.map((row) => [row.status, (row._count as { _all: number })._all]));
    return { items, statusCounts, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        organization: organizationSummary,
        documents: { orderBy: { uploadedAt: 'desc' } },
        opinions: { orderBy: { createdAt: 'desc' }, include: { reviews: true } },
        decisions: { orderBy: { decidedAt: 'desc' } },
      },
    });
    if (!process) throw new NotFoundException('Processo não encontrado.');
    this.assertOrganizationAccess(process.organizationId, actor);
    const allowedTransitions = canUpdateProcessInOrganization(actor, process.organizationId) ? NEXT_STATUS[process.status] : [];
    return { ...process, allowedTransitions };
  }

  async update(id: string, dto: UpdateProcessDto, actor: AuthenticatedUser) {
    const current = await this.prisma.process.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Processo não encontrado.');
    this.assertOrganizationAccess(current.organizationId, actor);
    if (!canUpdateProcessInOrganization(actor, current.organizationId)) {
      throw new ForbiddenException('Seu perfil não permite alterar este processo.');
    }
    const statusChanged = dto.status !== undefined && dto.status !== current.status;
    if (statusChanged) {
      if (dto.status === 'DECIDIDO') throw new BadRequestException('A situação DECIDIDO só poderá ser atribuída pelo módulo de decisão humana.');
      if (!canTransition(current.status, dto.status!)) throw new BadRequestException(`Transição de ${current.status} para ${dto.status} não permitida.`);
    }

    const data: Prisma.ProcessUpdateManyMutationInput = {};
    if (dto.applicantName !== undefined) data.applicantName = dto.applicantName;
    if (dto.infractionNoticeNumber !== undefined) data.infractionNoticeNumber = dto.infractionNoticeNumber || null;
    if (dto.violationDate !== undefined) data.violationDate = parseViolationDate(dto.violationDate) ?? null;
    if (dto.subject !== undefined) data.subject = dto.subject || null;
    if (statusChanged) data.status = dto.status;

    const changes: Record<string, { from: unknown; to: unknown }> = {};
    for (const [field, to] of Object.entries(data)) {
      const from = current[field as keyof typeof current];
      if (String(from ?? '') !== String(to ?? '')) changes[field] = { from, to };
    }
    if (!Object.keys(changes).length) return this.prisma.process.findUniqueOrThrow({ where: { id }, include: { organization: organizationSummary } });

    return this.prisma.$transaction(async (tx) => {
      // Conditional on the status we validated against: a concurrent change makes this match 0 rows.
      const { count } = await tx.process.updateMany({ where: { id, status: current.status }, data });
      if (count === 0) throw new ConflictException('O processo foi alterado por outra pessoa. Recarregue e tente novamente.');
      await tx.auditLog.create({
        data: {
          processId: id, actorId: actor.id,
          action: statusChanged ? 'PROCESS_STATUS_CHANGED' : 'PROCESS_UPDATED',
          entityType: 'Process', entityId: id,
          metadata: JSON.parse(JSON.stringify({ changes })) as Prisma.InputJsonValue,
        },
      });
      return tx.process.findUniqueOrThrow({ where: { id }, include: { organization: organizationSummary } });
    });
  }
}
