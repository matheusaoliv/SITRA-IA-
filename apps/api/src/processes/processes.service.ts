import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProcessStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { canAccessOrganization, canCreateProcessInOrganization, canUpdateProcessInOrganization } from '../auth/authorization.policy';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';

function parseViolationDate(value?: string) {
  if (!value) return undefined;
  return new Date(value.length === 10 ? `${value}T12:00:00.000Z` : value);
}
const nextStatus: Record<ProcessStatus, ProcessStatus[]> = {
  RECEBIDO: ['EM_TRIAGEM'],
  EM_TRIAGEM: ['EM_ANALISE'],
  EM_ANALISE: ['AGUARDANDO_REVISAO'],
  AGUARDANDO_REVISAO: [],
  DECIDIDO: [],
  ARQUIVADO: [],
};

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
            protocolNumber: dto.protocolNumber.trim(),
            type: dto.type,
            organizationId: dto.organizationId,
            applicantName: dto.applicantName.trim(),
            infractionNoticeNumber: dto.infractionNoticeNumber?.trim(),
            violationDate: parseViolationDate(dto.violationDate),
            subject: dto.subject?.trim(),
          },
          include: { organization: { select: { id: true, name: true, code: true } } },
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
    const [items, total] = await this.prisma.$transaction([
      this.prisma.process.findMany({
        where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit,
        include: { organization: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.process.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string, actor: AuthenticatedUser) {
    const process = await this.prisma.process.findUnique({
      where: { id },
      include: {
        organization: { select: { id: true, name: true, code: true } },
        documents: { orderBy: { uploadedAt: 'desc' } },
        opinions: { orderBy: { createdAt: 'desc' }, include: { reviews: true } },
        decisions: { orderBy: { decidedAt: 'desc' } },
      },
    });
    if (!process) throw new NotFoundException('Processo não encontrado.');
    this.assertOrganizationAccess(process.organizationId, actor);
    return process;
  }

  async update(id: string, dto: UpdateProcessDto, actor: AuthenticatedUser) {
    const current = await this.prisma.process.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Processo não encontrado.');
    this.assertOrganizationAccess(current.organizationId, actor);
    if (!canUpdateProcessInOrganization(actor, current.organizationId)) {
      throw new ForbiddenException('Seu perfil não permite alterar este processo.');
    }
    if (dto.status && dto.status !== current.status) {
      if (dto.status === 'DECIDIDO') throw new BadRequestException('A situação DECIDIDO só poderá ser atribuída pelo módulo de decisão humana.');
      if (!nextStatus[current.status].includes(dto.status)) throw new BadRequestException(`Transição de ${current.status} para ${dto.status} não permitida.`);
    }
    return this.prisma.$transaction(async (tx) => {
      const process = await tx.process.update({
        where: { id },
        data: {
          ...(dto.applicantName !== undefined ? { applicantName: dto.applicantName.trim() } : {}),
          ...(dto.infractionNoticeNumber !== undefined ? { infractionNoticeNumber: dto.infractionNoticeNumber.trim() } : {}),
          ...(dto.violationDate !== undefined ? { violationDate: parseViolationDate(dto.violationDate) } : {}),
          ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: { organization: { select: { id: true, name: true, code: true } } },
      });
      await tx.auditLog.create({
        data: {
          processId: id, actorId: actor.id,
          action: dto.status && dto.status !== current.status ? 'PROCESS_STATUS_CHANGED' : 'PROCESS_UPDATED',
          entityType: 'Process', entityId: id,
          metadata: { previousStatus: current.status, currentStatus: process.status },
        },
      });
      return process;
    });
  }
}
