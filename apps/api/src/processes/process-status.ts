import { ProcessStatus } from '@prisma/client';

// DECIDIDO is only set by the human-decision module; ARQUIVADO awaits its own rule set.
export const NEXT_STATUS: Record<ProcessStatus, ProcessStatus[]> = {
  RECEBIDO: ['EM_TRIAGEM'],
  EM_TRIAGEM: ['EM_ANALISE'],
  EM_ANALISE: ['AGUARDANDO_REVISAO'],
  AGUARDANDO_REVISAO: ['EM_ANALISE'],
  DECIDIDO: [],
  ARQUIVADO: [],
};

export function canTransition(from: ProcessStatus, to: ProcessStatus): boolean {
  return NEXT_STATUS[from].includes(to);
}
