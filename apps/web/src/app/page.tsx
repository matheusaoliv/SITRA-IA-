'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { errorMessage, request, statusLabels, typeLabels } from '@/lib/api';

type Organization = { id: string; name: string; code?: string | null };
type Me = { name: string; isSystemAdmin: boolean; memberships: Array<{ organizationId: string; role: string }> };
type ProcessItem = {
  id: string;
  protocolNumber: string;
  type: string;
  status: string;
  applicantName: string;
  createdAt: string;
  organization: Organization;
};
type PageResult = {
  items: ProcessItem[];
  statusCounts: Record<string, number>;
  pagination: { page: number; limit: number; total: number; pages: number };
};

const PAGE_SIZE = 20;
const fieldStyle = { width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#102a43' } as const;
const emptyForm = { protocolNumber: '', type: 'DEFESA_PREVIA', organizationId: '', applicantName: '', infractionNoticeNumber: '', violationDate: '', subject: '' };

export default function Home() {
  const [me, setMe] = useState<Me | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [result, setResult] = useState<PageResult | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [reloadKey, setReloadKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [form, setForm] = useState(emptyForm);

  const loadOrganizations = useCallback(async () => {
    const data = await request<Organization[]>('/organizations');
    setOrganizations(data);
    setForm((current) => ({ ...current, organizationId: current.organizationId || data[0]?.id || '' }));
  }, []);

  useEffect(() => {
    request<Me>('/auth/me').then(setMe).catch(() => undefined);
    loadOrganizations().catch((err) => setError(errorMessage(err, 'Não foi possível carregar os órgãos.')));
  }, [loadOrganizations]);

  useEffect(() => {
    const timer = setTimeout(() => { setDebouncedSearch(search.trim()); setPage(1); }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    // Aborting the previous request keeps a slow, stale response from overwriting a newer one.
    const controller = new AbortController();
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (filterStatus) params.set('status', filterStatus);
    request<PageResult>(`/processes?${params}`, { signal: controller.signal })
      .then((data) => { setResult(data); setError(''); })
      .catch((err) => { if (!controller.signal.aborted) setError(errorMessage(err, 'Falha ao carregar processos.')); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [page, debouncedSearch, filterStatus, reloadKey]);

  const canProtocol = !!me && (me.isSystemAdmin || me.memberships.some((m) => ['PROTOCOLO', 'GESTOR'].includes(m.role)));
  const counts = result?.statusCounts ?? {};
  const countOf = (...statuses: string[]) => statuses.reduce((sum, status) => sum + (counts[status] ?? 0), 0);

  async function logout() {
    try { await request('/auth/logout', { method: 'POST' }); } finally { window.location.assign('/sign-in'); }
  }

  async function createProcess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      await request<ProcessItem>('/processes', {
        method: 'POST',
        body: JSON.stringify({
          ...form,
          violationDate: form.violationDate || undefined,
          infractionNoticeNumber: form.infractionNoticeNumber || undefined,
          subject: form.subject || undefined,
        }),
      });
      setForm((current) => ({ ...emptyForm, type: current.type, organizationId: current.organizationId }));
      setNotice('Processo cadastrado e registrado na trilha de auditoria.');
      setPage(1); setReloadKey((key) => key + 1);
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível cadastrar o processo.'));
    } finally { setSaving(false); }
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const created = await request<Organization>('/organizations', {
        method: 'POST', body: JSON.stringify({ name: orgName, code: orgCode || undefined }),
      });
      await loadOrganizations();
      setForm((current) => ({ ...current, organizationId: created.id }));
      setOrgName(''); setOrgCode(''); setShowOrgForm(false);
      setNotice('Órgão cadastrado e selecionado no formulário.');
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível cadastrar o órgão.'));
    } finally { setSaving(false); }
  }

  const pagination = result?.pagination;
  const items = result?.items ?? [];

  return (
    <main className="sitra-shell">
      <header className="sitra-header">
        <div>
          <div className="eyebrow">GESTÃO ADMINISTRATIVA DE TRÂNSITO</div>
          <h1>SITRA <span>IA</span></h1>
          <p>Sistema Inteligente de Trânsito e Recursos Administrativos</p>
        </div>
        <div className="header-actions">
          {me && <div className="header-tag">{me.name}{me.isSystemAdmin ? ' · ADMINISTRADOR' : ''}</div>}
          <button className="logout-button" type="button" onClick={logout}>Sair</button>
        </div>
      </header>

      <section className="notice-banner">
        <strong>Revisão humana obrigatória</strong>
        <span>A plataforma organiza informações e apoia a análise. A decisão administrativa permanece sob responsabilidade da autoridade competente.</span>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <section className="metric-grid" aria-label="Resumo por situação">
        <article className="metric-card"><span>Processos</span><strong>{countOf(...Object.keys(statusLabels))}</strong><small>No seu escopo, conforme a busca</small></article>
        <article className="metric-card"><span>Recebidos</span><strong>{countOf('RECEBIDO')}</strong><small>Na primeira etapa do fluxo</small></article>
        <article className="metric-card"><span>Em análise</span><strong>{countOf('EM_TRIAGEM', 'EM_ANALISE')}</strong><small>Triagem ou análise técnica</small></article>
        <article className="metric-card"><span>Aguardando revisão</span><strong>{countOf('AGUARDANDO_REVISAO')}</strong><small>Conferência por pessoa autorizada</small></article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div><div className="eyebrow dark">PROTOCOLO</div><h2>Novo processo</h2><p>Cadastre os dados iniciais do requerimento.</p></div>
            <span className="step-mark">01</span>
          </div>

          {me?.isSystemAdmin && (
            <div style={{ marginBottom: 14 }}>
              <button type="button" className="text-button" aria-expanded={showOrgForm} onClick={() => setShowOrgForm((value) => !value)}>
                {showOrgForm ? 'Fechar cadastro de órgão' : '+ Cadastrar novo órgão'}
              </button>
              {showOrgForm && (
                <form className="inline-form" style={{ marginTop: 10 }} onSubmit={createOrganization}>
                  <label>Nome do órgão<input style={fieldStyle} required minLength={2} maxLength={160} value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Nome institucional" /></label>
                  <label>Código (opcional)<input style={fieldStyle} minLength={2} maxLength={20} pattern="[A-Za-z0-9_\-]+" value={orgCode} onChange={(e) => setOrgCode(e.target.value)} placeholder="Ex.: SMT" /></label>
                  <button className="secondary-button" disabled={saving} type="submit">Salvar órgão</button>
                </form>
              )}
            </div>
          )}

          {!canProtocol && me ? (
            <div className="empty-state"><strong>Sem permissão de protocolo</strong><span>Seu perfil permite consultar e acompanhar processos.</span></div>
          ) : organizations.length === 0 && me ? (
            <div className="empty-state"><strong>Nenhum órgão disponível</strong><span>{me.isSystemAdmin ? 'Cadastre um órgão para começar.' : 'Solicite ao administrador o vínculo a um órgão.'}</span></div>
          ) : (
            <form onSubmit={createProcess} className="form-stack">
              <label>Número do protocolo<input style={fieldStyle} required minLength={3} maxLength={60} value={form.protocolNumber} onChange={(e) => setForm({ ...form, protocolNumber: e.target.value })} placeholder="Ex.: 2026/000123" /></label>
              <label>Tipo de procedimento<select style={fieldStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <label>Órgão responsável
                <select style={fieldStyle} required value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
                  <option value="">Selecione um órgão</option>
                  {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}{org.code ? ` · ${org.code}` : ''}</option>)}
                </select>
              </label>
              <label>Nome do requerente<input style={fieldStyle} required minLength={3} maxLength={180} value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} placeholder="Nome completo" /></label>
              <label>Número do auto de infração<input style={fieldStyle} maxLength={80} value={form.infractionNoticeNumber} onChange={(e) => setForm({ ...form, infractionNoticeNumber: e.target.value })} placeholder="Opcional" /></label>
              <label>Data da infração<input style={fieldStyle} type="date" max={new Date().toISOString().slice(0, 10)} value={form.violationDate} onChange={(e) => setForm({ ...form, violationDate: e.target.value })} /></label>
              <label>Assunto / observações iniciais<textarea style={{ ...fieldStyle, minHeight: 84, resize: 'vertical' }} maxLength={2000} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Resumo breve, sem inserir dados sensíveis desnecessários." /></label>
              <button className="primary-button" type="submit" disabled={saving || !form.organizationId}>{saving ? 'Salvando...' : 'Cadastrar processo'}</button>
            </form>
          )}
        </div>

        <div className="panel process-panel">
          <div className="panel-heading">
            <div><div className="eyebrow dark">ACOMPANHAMENTO</div><h2>Processos cadastrados</h2><p>Consulta e acompanhamento do fluxo administrativo.</p></div>
            <span className="step-mark">02</span>
          </div>
          <div className="filters">
            <input style={fieldStyle} type="search" maxLength={100} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar protocolo, requerente ou auto..." aria-label="Buscar processos" />
            <select style={fieldStyle} value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }} aria-label="Filtrar por situação">
              <option value="">Todas as situações</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          {loading && !result ? <div className="empty-state" aria-live="polite">Carregando processos...</div> : items.length === 0 ? <div className="empty-state"><strong>Nenhum processo encontrado</strong><span>Cadastre um processo ou ajuste os filtros.</span></div> :
            <div className="process-list" aria-busy={loading}>{items.map((item) => <Link className="process-row" href={`/processes/${item.id}`} key={item.id}>
              <div className="process-row-top"><strong>{item.protocolNumber}</strong><span className={`status status-${item.status.toLowerCase()}`}>{statusLabels[item.status] ?? item.status}</span></div>
              <div className="process-person">{item.applicantName}</div>
              <div className="process-meta"><span>{typeLabels[item.type] ?? item.type}</span><span>{item.organization.name}</span><span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span></div>
            </Link>)}</div>}
          {pagination && pagination.pages > 1 && (
            <nav className="pager" aria-label="Paginação">
              <button type="button" className="secondary-button" disabled={page <= 1 || loading} onClick={() => setPage(page - 1)}>Anterior</button>
              <span>Página {pagination.page} de {pagination.pages} · {pagination.total} processos</span>
              <button type="button" className="secondary-button" disabled={page >= pagination.pages || loading} onClick={() => setPage(page + 1)}>Próxima</button>
            </nav>
          )}
        </div>
      </section>
      <footer className="sitra-footer">SITRA IA · Protótipo de desenvolvimento · Não utilizar dados reais nesta versão.</footer>
    </main>
  );
}
