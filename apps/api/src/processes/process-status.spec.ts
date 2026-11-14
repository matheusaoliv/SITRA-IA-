import { describe, it } from 'node:test';
import * as assert from 'node:assert/strict';
import { canTransition, NEXT_STATUS } from './process-status';

describe('fluxo de situação do processo', () => {
  it('segue a ordem prevista', () => {
    assert.equal(canTransition('RECEBIDO', 'EM_TRIAGEM'), true);
    assert.equal(canTransition('EM_TRIAGEM', 'EM_ANALISE'), true);
    assert.equal(canTransition('EM_ANALISE', 'AGUARDANDO_REVISAO'), true);
  });
  it('permite devolver da revisão para análise', () => {
    assert.equal(canTransition('AGUARDANDO_REVISAO', 'EM_ANALISE'), true);
  });
  it('não pula etapas', () => {
    assert.equal(canTransition('RECEBIDO', 'EM_ANALISE'), false);
  });
  it('nunca permite DECIDIDO pelo fluxo genérico', () => {
    for (const targets of Object.values(NEXT_STATUS)) assert.equal(targets.includes('DECIDIDO'), false);
  });
});
