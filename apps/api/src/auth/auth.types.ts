import { OrganizationRole } from '@prisma/client';
export type AuthenticatedUser = {
  id: string; email: string; name: string; isSystemAdmin: boolean;
  memberships: Array<{ organizationId: string; role: OrganizationRole }>;
};
export type RequestWithUser = {
  headers: { cookie?: string; origin?: string };
  method: string;
  user?: AuthenticatedUser;
};
