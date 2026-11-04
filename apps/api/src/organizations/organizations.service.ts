import { ConflictException, ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}
  async create(dto: CreateOrganizationDto, actor: AuthenticatedUser) {
    if (!actor.isSystemAdmin) throw new ForbiddenException('Somente o administrador do sistema pode cadastrar órgãos.');
    try {
      const organization = await this.prisma.organization.create({ data: { name: dto.name.trim(), code: dto.code?.toUpperCase() } });
      await this.prisma.auditLog.create({ data: { actorId: actor.id, action: 'ORGANIZATION_CREATED', entityType: 'Organization', entityId: organization.id } });
      return organization;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') throw new ConflictException('Já existe um órgão cadastrado com este código.');
      throw error;
    }
  }
  findAll(actor: AuthenticatedUser) {
    if (actor.isSystemAdmin) return this.prisma.organization.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, createdAt: true } });
    const ids = actor.memberships.map((item) => item.organizationId);
    return this.prisma.organization.findMany({ where: { id: { in: ids } }, orderBy: { name: 'asc' }, select: { id: true, name: true, code: true, createdAt: true } });
  }
}
