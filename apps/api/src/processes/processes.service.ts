import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, ProcessStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProcessDto } from './dto/create-process.dto';
import { UpdateProcessDto } from './dto/update-process.dto';

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

  async create(dto: CreateProcessDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const process = await tx.process.create({
          data: {
            protocolNumber: dto.protocolNumber.trim(),
            type: dto.type,
            organizationId: dto.organizationId,
            applicantName: dto.applicantName.trim(),
            infractionNoticeNumber: dto.infractionNoticeNumber?.trim(),
            violationDate: dto.violationDate ? new Date(dto.violationDate) : undefined,
            subject: dto.subject?.trim(),
          },
          include: { organization: { select: { id: true, name: true, code: true } } },
        });

        await tx.auditLog.create({
          data: {
            processId: process.id,
            action: 'PROCESS_CREATED',
            entityType: 'Process',
            entityId: process.id,
            metadata: { protocolNumber: process.protocolNumber, type: process.type },
          },
        });
        return process;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('Já existe um processo com este número de protocolo.');
      }
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2003') {
        throw new BadRequestException('Órgão informado não encontrado.');
      }
      throw error;
    }
  }

  async findAll(filters: { organizationId?: string; status?: ProcessStatus; search?: string; page?: number; limit?: number }) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.min(100, Math.max(1, filters.limit || 20));
    const where: Prisma.ProcessWhereInput = {
      ...(filters.organizationId ? { organizationId: filters.organizationId } : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.search ? {
        OR: [
          { protocolNumber: { contains: filters.search, mode: 'insensitive' } },
          { applicantName: { contains: filters.search, mode: 'insensitive' } },
          { infractionNoticeNumber: { contains: filters.search, mode: 'insensitive' } },
        ],
      } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.process.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { organization: { select: { id: true, name: true, code: true } } },
      }),
      this.prisma.process.count({ where }),
    ]);
    return { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async findOne(id: string) {
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
    return process;
  }

  async update(id: string, dto: UpdateProcessDto) {
    const current = await this.prisma.process.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Processo não encontrado.');

    if (dto.status && dto.status !== current.status) {
      if (dto.status === 'DECIDIDO') {
        throw new BadRequestException('A situação DECIDIDO só poderá ser atribuída pelo módulo de decisão humana.');
      }
      if (!nextStatus[current.status].includes(dto.status)) {
        throw new BadRequestException(`Transição de ${current.status} para ${dto.status} não permitida.`);
      }
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const process = await tx.process.update({
        where: { id },
        data: {
          ...(dto.applicantName !== undefined ? { applicantName: dto.applicantName.trim() } : {}),
          ...(dto.infractionNoticeNumber !== undefined ? { infractionNoticeNumber: dto.infractionNoticeNumber.trim() } : {}),
          ...(dto.violationDate !== undefined ? { violationDate: new Date(dto.violationDate) } : {}),
          ...(dto.subject !== undefined ? { subject: dto.subject.trim() } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
        },
        include: { organization: { select: { id: true, name: true, code: true } } },
      });
      await tx.auditLog.create({
        data: {
          processId: id,
          action: dto.status && dto.status !== current.status ? 'PROCESS_STATUS_CHANGED' : 'PROCESS_UPDATED',
          entityType: 'Process',
          entityId: id,
          metadata: { previousStatus: current.status, currentStatus: process.status },
        },
      });
      return process;
    });
    return updated;
  }
}
