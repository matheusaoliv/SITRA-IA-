import { OrganizationRole } from '@prisma/client';
import { AuthenticatedUser } from './auth.types';

export function canAccessOrganization(actor: AuthenticatedUser, organizationId: string): boolean {
  return actor.isSystemAdmin || actor.memberships.some((membership) => membership.organizationId === organizationId);
}

export function canCreateProcessInOrganization(actor: AuthenticatedUser, organizationId: string): boolean {
  return actor.isSystemAdmin || actor.memberships.some((membership) =>
    membership.organizationId === organizationId &&
    [OrganizationRole.PROTOCOLO, OrganizationRole.GESTOR].includes(membership.role),
  );
}

export function canUpdateProcessInOrganization(actor: AuthenticatedUser, organizationId: string): boolean {
  return actor.isSystemAdmin || actor.memberships.some((membership) =>
    membership.organizationId === organizationId &&
    [OrganizationRole.ANALISTA, OrganizationRole.GESTOR].includes(membership.role),
  );
}
