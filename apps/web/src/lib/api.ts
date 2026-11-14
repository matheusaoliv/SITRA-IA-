// Same-origin by default: next.config.ts rewrites /api/v1 to the API.
export const API = (process.env.NEXT_PUBLIC_SITRA_API_URL || '/api/v1').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message: string, readonly status: number) { super(message); }
}

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401 && !path.startsWith('/auth/login')) {
    window.location.assign(`/sign-in?next=${encodeURIComponent(window.location.pathname)}`);
    throw new ApiError('Sessão expirada. Entre novamente.', 401);
  }
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new ApiError(message || 'Não foi possível concluir a operação.', response.status);
  }
  return body as T;
}

export const errorMessage = (err: unknown, fallback: string) => (err instanceof Error ? err.message : fallback);

export const statusLabels: Record<string, string> = {
  RECEBIDO: 'Recebido', EM_TRIAGEM: 'Em triagem', EM_ANALISE: 'Em análise',
  AGUARDANDO_REVISAO: 'Aguardando revisão', DECIDIDO: 'Decidido', ARQUIVADO: 'Arquivado',
};
export const typeLabels: Record<string, string> = {
  DEFESA_PREVIA: 'Defesa prévia', JARI: 'Recurso à JARI', CETRAN: 'Recurso ao CETRAN',
};
