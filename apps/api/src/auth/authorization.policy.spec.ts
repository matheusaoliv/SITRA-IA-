import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { OrganizationRole } from '@prisma/client';
import {
  canAccessOrganization,
  canCreateProcessInOrganization,
  canUpdateProcessInOrganization,
} from './authorization.policy';
import { AuthenticatedUser } from './auth.types';

function user(memberships: AuthenticatedUser['memberships'], isSystemAdmin = false): AuthenticatedUser {
  return { id: 'user-1', email: 'test@example.org', name: 'Teste', isSystemAdmin, memberships };
}

describe('políticas de autorização por órgão', () => {
  it('impede acesso a órgão sem vínculo', () => {
    const actor = user([{ organizationId: 'org-a', role: OrganizationRole.ANALISTA }]);
    assert.equal(canAccessOrganization(actor, 'org-b'), false);
  });

  it('permite acesso somente ao órgão vinculado', () => {
    const actor = user([{ organizationId: 'org-a', role: OrganizationRole.ANALISTA }]);
    assert.equal(canAccessOrganization(actor, 'org-a'), true);
    assert.equal(canAccessOrganization(actor, 'org-b'), false);
  });

  it('não permite protocolo a perfil analista', () => {
    const actor = user([{ organizationId: 'org-a', role: OrganizationRole.ANALISTA }]);
    assert.equal(canCreateProcessInOrganization(actor, 'org-a'), false);
  });

  it('permite protocolo apenas ao perfil habilitado no órgão correspondente', () => {
    const actor = user([{ organizationId: 'org-a', role: OrganizationRole.PROTOCOLO }]);
    assert.equal(canCreateProcessInOrganization(actor, 'org-a'), true);
    assert.equal(canCreateProcessInOrganization(actor, 'org-b'), false);
  });

  it('não permite alteração a perfil protocolo', () => {
    const actor = user([{ organizationId: 'org-a', role: OrganizationRole.PROTOCOLO }]);
    assert.equal(canUpdateProcessInOrganization(actor, 'org-a'), false);
  });

  it('permite análise apenas no órgão em que o perfil analista está vinculado', () => {
    const actor = user([{ organizationId: 'org-a', role: OrganizationRole.ANALISTA }]);
    assert.equal(canUpdateProcessInOrganization(actor, 'org-a'), true);
    assert.equal(canUpdateProcessInOrganization(actor, 'org-b'), false);
  });

  it('permite ao administrador global operar entre órgãos', () => {
    const actor = user([], true);
    assert.equal(canAccessOrganization(actor, 'org-a'), true);
    assert.equal(canCreateProcessInOrganization(actor, 'org-b'), true);
    assert.equal(canUpdateProcessInOrganization(actor, 'org-c'), true);
  });

  it('não mistura permissões de órgãos diferentes', () => {
    const actor = user([
      { organizationId: 'org-a', role: OrganizationRole.PROTOCOLO },
      { organizationId: 'org-b', role: OrganizationRole.ANALISTA },
    ]);
    assert.equal(canCreateProcessInOrganization(actor, 'org-a'), true);
    assert.equal(canCreateProcessInOrganization(actor, 'org-b'), false);
    assert.equal(canUpdateProcessInOrganization(actor, 'org-a'), false);
    assert.equal(canUpdateProcessInOrganization(actor, 'org-b'), true);
  });
});
