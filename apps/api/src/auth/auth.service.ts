import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { OrganizationRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from './auth.types';

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.trim().toLowerCase() },
      include: { memberships: { where: { active: true }, select: { organizationId: true, role: true } } },
    });
    if (!user || user.disabledAt || !(await argon2.verify(user.passwordHash, password))) {
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);
    await this.prisma.$transaction([
      this.prisma.session.create({ data: { userId: user.id, tokenHash: hashToken(token), expiresAt } }),
      this.prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } }),
      this.prisma.auditLog.create({ data: { actorId: user.id, action: 'AUTH_LOGIN', entityType: 'User', entityId: user.id } }),
    ]);
    return { token, expiresAt, user: this.toUser(user) };
  }

  async validateSession(token: string): Promise<AuthenticatedUser | null> {
    const session = await this.prisma.session.findUnique({
      where: { tokenHash: hashToken(token) },
      include: { user: { include: { memberships: { where: { active: true }, select: { organizationId: true, role: true } } } } },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date() || session.user.disabledAt) return null;
    return this.toUser(session.user);
  }

  async revokeSession(token: string) {
    const session = await this.prisma.session.findUnique({ where: { tokenHash: hashToken(token) }, select: { id: true, userId: true } });
    if (!session) return;
    await this.prisma.$transaction([
      this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } }),
      this.prisma.auditLog.create({ data: { actorId: session.userId, action: 'AUTH_LOGOUT', entityType: 'Session', entityId: session.id } }),
    ]);
  }

  async createOrganizationUser(input: { organizationId: string; name: string; email: string; password: string; role: OrganizationRole }, actor: AuthenticatedUser) {
    this.assertOrganizationManager(input.organizationId, actor);
    if (input.role === OrganizationRole.GESTOR && !actor.isSystemAdmin) throw new ForbiddenException('Somente o administrador do sistema pode atribuir o perfil Gestor.');
    const email = input.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      const link = await this.prisma.userOrganization.findUnique({ where: { userId_organizationId: { userId: existing.id, organizationId: input.organizationId } } });
      if (link) throw new ForbiddenException('Este usuário já possui vínculo com o órgão informado.');
      const membership = await this.prisma.userOrganization.create({ data: { userId: existing.id, organizationId: input.organizationId, role: input.role } });
      await this.audit(actor.id, 'USER_ORG_LINKED', membership.id, { organizationId: input.organizationId, role: input.role });
      return { userId: existing.id, name: existing.name, email: existing.email, membership };
    }
    const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });
    const created = await this.prisma.user.create({
      data: { name: input.name.trim(), email, passwordHash, memberships: { create: { organizationId: input.organizationId, role: input.role } } },
      select: { id: true, name: true, email: true, memberships: true },
    });
    await this.audit(actor.id, 'USER_CREATED', created.id, { organizationId: input.organizationId, role: input.role });
    return created;
  }

  async listOrganizationUsers(organizationId: string, actor: AuthenticatedUser) {
    this.assertOrganizationManager(organizationId, actor);
    return this.prisma.userOrganization.findMany({
      where: { organizationId }, orderBy: { user: { name: 'asc' } },
      select: { role: true, active: true, createdAt: true, user: { select: { id: true, name: true, email: true, disabledAt: true, lastLoginAt: true } } },
    });
  }

  async updateMembershipRole(organizationId: string, userId: string, role: OrganizationRole, actor: AuthenticatedUser) {
    this.assertOrganizationManager(organizationId, actor);
    if (role === OrganizationRole.GESTOR && !actor.isSystemAdmin) throw new ForbiddenException('Somente o administrador do sistema pode atribuir o perfil Gestor.');
    const membership = await this.prisma.userOrganization.update({ where: { userId_organizationId: { userId, organizationId } }, data: { role } });
    await this.audit(actor.id, 'USER_ROLE_CHANGED', membership.id, { organizationId, userId, role });
    return membership;
  }

  private assertOrganizationManager(organizationId: string, actor: AuthenticatedUser) {
    const membership = actor.memberships.find((item) => item.organizationId === organizationId);
    if (!actor.isSystemAdmin && membership?.role !== OrganizationRole.GESTOR) throw new ForbiddenException('Você não possui permissão para administrar usuários deste órgão.');
  }

  private audit(actorId: string, action: string, entityId: string, metadata: object) {
    return this.prisma.auditLog.create({ data: { actorId, action, entityType: 'User', entityId, metadata: metadata as import('@prisma/client').Prisma.InputJsonValue } });
  }

  private toUser(user: { id: string; email: string; name: string; isSystemAdmin: boolean; memberships: Array<{ organizationId: string; role: OrganizationRole }> }): AuthenticatedUser {
    return { id: user.id, email: user.email, name: user.name, isSystemAdmin: user.isSystemAdmin, memberships: user.memberships };
  }
}
