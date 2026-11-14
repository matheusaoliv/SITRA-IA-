import { OrganizationRole } from '@prisma/client';
import { AuthenticatedUser } from './auth.types';

const PROTOCOL_ROLES: OrganizationRole[] = [OrganizationRole.PROTOCOLO, OrganizationRole.GESTOR];
const UPDATE_ROLES: OrganizationRole[] = [OrganizationRole.ANALISTA, OrganizationRole.GESTOR];

function hasRoleIn(actor: AuthenticatedUser, organizationId: string, roles: OrganizationRole[]): boolean {
  return actor.isSystemAdmin || actor.memberships.some((m) => m.organizationId === organizationId && roles.includes(m.role));
}

export function canAccessOrganization(actor: AuthenticatedUser, organizationId: string): boolean {
  return actor.isSystemAdmin || actor.memberships.some((membership) => membership.organizationId === organizationId);
}

export function canCreateProcessInOrganization(actor: AuthenticatedUser, organizationId: string): boolean {
  return hasRoleIn(actor, organizationId, PROTOCOL_ROLES);
}

export function canUpdateProcessInOrganization(actor: AuthenticatedUser, organizationId: string): boolean {
  return hasRoleIn(actor, organizationId, UPDATE_ROLES);
}

export function canManageOrganization(actor: AuthenticatedUser, organizationId: string): boolean {
  return hasRoleIn(actor, organizationId, [OrganizationRole.GESTOR]);
}
