'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

type Organization = { id: string; name: string; code?: string | null };
type ProcessItem = {
  id: string;
  protocolNumber: string;
  type: 'DEFESA_PREVIA' | 'JARI' | 'CETRAN';
  status: 'RECEBIDO' | 'EM_TRIAGEM' | 'EM_ANALISE' | 'AGUARDANDO_REVISAO' | 'DECIDIDO' | 'ARQUIVADO';
  applicantName: string;
  infractionNoticeNumber?: string | null;
  createdAt: string;
  organization: Organization;
};
type PageResult = { items: ProcessItem[]; pagination: { page: number; limit: number; total: number; pages: number } };

const API = (process.env.NEXT_PUBLIC_SITRA_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const statusLabels: Record<ProcessItem['status'], string> = {
  RECEBIDO: 'Recebido', EM_TRIAGEM: 'Em triagem', EM_ANALISE: 'Em análise',
  AGUARDANDO_REVISAO: 'Aguardando revisão', DECIDIDO: 'Decidido', ARQUIVADO: 'Arquivado',
};
const typeLabels: Record<ProcessItem['type'], string> = {
  DEFESA_PREVIA: 'Defesa prévia', JARI: 'Recurso à JARI', CETRAN: 'Recurso ao CETRAN',
};
const cardStyle = { background: '#fff', border: '1px solid #e1e8ef', borderRadius: 14, padding: 20 } as const;
const fieldStyle = { width: '100%', padding: '11px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fff', color: '#102a43' } as const;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(body.message) ? body.message.join(', ') : body.message;
    throw new Error(message || 'Não foi possível concluir a operação.');
  }
  return body as T;
}

export default function Home() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [items, setItems] = useState<ProcessItem[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [form, setForm] = useState({ protocolNumber: '', type: 'DEFESA_PREVIA', organizationId: '', applicantName: '', infractionNoticeNumber: '', violationDate: '', subject: '' });

  const loadOrganizations = useCallback(async () => {
    const data = await request<Organization[]>('/organizations');
    setOrganizations(data);
    setForm((current) => ({ ...current, organizationId: current.organizationId || data[0]?.id || '' }));
  }, []);

  const loadProcesses = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (search.trim()) params.set('search', search.trim());
      if (filterStatus) params.set('status', filterStatus);
      const data = await request<PageResult>(`/processes?${params.toString()}`);
      setItems(data.items);
      setTotal(data.pagination.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha ao carregar processos. Verifique se a API está ativa.');
    } finally {
      setLoading(false);
    }
  }, [search, filterStatus]);

  useEffect(() => {
    loadOrganizations().catch((err) => setError(err instanceof Error ? err.message : 'Não foi possível carregar os órgãos.'));
  }, [loadOrganizations]);

  useEffect(() => { loadProcesses(); }, [loadProcesses]);

  const counts = useMemo(() => ({
    received: items.filter((item) => item.status === 'RECEBIDO').length,
    analysis: items.filter((item) => ['EM_TRIAGEM', 'EM_ANALISE'].includes(item.status)).length,
    review: items.filter((item) => item.status === 'AGUARDANDO_REVISAO').length,
  }), [items]);

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
      setForm((current) => ({ ...current, protocolNumber: '', applicantName: '', infractionNoticeNumber: '', violationDate: '', subject: '' }));
      setNotice('Processo cadastrado e registrado na trilha de auditoria.');
      await loadProcesses();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o processo.');
    } finally { setSaving(false); }
  }

  async function createOrganization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try {
      const created = await request<Organization>('/organizations', {
        method: 'POST', body: JSON.stringify({ name: orgName, code: orgCode || undefined }),
      });
      setOrganizations((current) => [...current, created]);
      setForm((current) => ({ ...current, organizationId: created.id }));
      setOrgName(''); setOrgCode(''); setShowOrgForm(false);
      setNotice('Órgão cadastrado. Agora ele está selecionado no formulário.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível cadastrar o órgão.');
    } finally { setSaving(false); }
  }

  return (
    <main className="sitra-shell">
      <header className="sitra-header">
        <div>
          <div className="eyebrow">GESTÃO ADMINISTRATIVA DE TRÂNSITO</div>
          <h1>SITRA <span>IA</span></h1>
          <p>Sistema Inteligente de Trânsito e Recursos Administrativos</p>
        </div>
        <div className="header-tag">AMBIENTE DE DESENVOLVIMENTO</div>
      </header>

      <section className="notice-banner">
        <strong>Revisão humana obrigatória</strong>
        <span>A plataforma organiza informações e apoia a análise. A decisão administrativa permanece sob responsabilidade da autoridade competente.</span>
      </section>

      {error && <div className="alert alert-error" role="alert">{error}</div>}
      {notice && <div className="alert alert-success" role="status">{notice}</div>}

      <section className="metric-grid">
        <article className="metric-card"><span>Processos encontrados</span><strong>{total}</strong><small>Conforme os filtros aplicados</small></article>
        <article className="metric-card"><span>Recebidos</span><strong>{counts.received}</strong><small>Na primeira etapa do fluxo</small></article>
        <article className="metric-card"><span>Em análise</span><strong>{counts.analysis}</strong><small>Triagem ou análise técnica</small></article>
        <article className="metric-card"><span>Aguardando revisão</span><strong>{counts.review}</strong><small>Conferência por pessoa autorizada</small></article>
      </section>

      <section className="content-grid">
        <div className="panel">
          <div className="panel-heading">
            <div><div className="eyebrow dark">PROTOCOLO</div><h2>Novo processo</h2><p>Cadastre os dados iniciais do requerimento.</p></div>
            <span className="step-mark">01</span>
          </div>
          <form onSubmit={createProcess} className="form-stack">
            <label>Número do protocolo<input style={fieldStyle} required minLength={3} maxLength={60} value={form.protocolNumber} onChange={(e) => setForm({ ...form, protocolNumber: e.target.value })} placeholder="Ex.: 2026/000123" /></label>
            <label>Tipo de procedimento<select style={fieldStyle} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}><option value="DEFESA_PREVIA">Defesa prévia</option><option value="JARI">Recurso à JARI</option><option value="CETRAN">Recurso ao CETRAN</option></select></label>
            <label>Órgão responsável
              <select style={fieldStyle} required value={form.organizationId} onChange={(e) => setForm({ ...form, organizationId: e.target.value })}>
                <option value="">Selecione um órgão</option>
                {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}{org.code ? ` · ${org.code}` : ''}</option>)}
              </select>
            </label>
            <button type="button" className="text-button" onClick={() => setShowOrgForm((value) => !value)}>{showOrgForm ? 'Fechar cadastro de órgão' : '+ Cadastrar novo órgão'}</button>
            {showOrgForm && <div className="inline-form">
              <label>Nome do órgão<input style={fieldStyle} required value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Nome institucional" /></label>
              <label>Código (opcional)<input style={fieldStyle} value={orgCode} onChange={(e) => setOrgCode(e.target.value)} placeholder="Ex.: SMT" /></label>
              <button className="secondary-button" disabled={saving} type="button" onClick={() => {
                if (!orgName.trim()) { setError('Informe o nome do órgão.'); return; }
                request<Organization>('/organizations', { method: 'POST', body: JSON.stringify({ name: orgName, code: orgCode || undefined }) })
                  .then((created) => { setOrganizations((current) => [...current, created]); setForm((current) => ({ ...current, organizationId: created.id })); setOrgName(''); setOrgCode(''); setShowOrgForm(false); setNotice('Órgão cadastrado e selecionado.'); })
                  .catch((err) => setError(err instanceof Error ? err.message : 'Falha ao cadastrar órgão.'));
              }}>Salvar órgão</button>
            </div>}
            <label>Nome do requerente<input style={fieldStyle} required minLength={3} maxLength={180} value={form.applicantName} onChange={(e) => setForm({ ...form, applicantName: e.target.value })} placeholder="Nome completo" /></label>
            <label>Número do auto de infração<input style={fieldStyle} maxLength={80} value={form.infractionNoticeNumber} onChange={(e) => setForm({ ...form, infractionNoticeNumber: e.target.value })} placeholder="Opcional" /></label>
            <label>Data da infração<input style={fieldStyle} type="date" value={form.violationDate} onChange={(e) => setForm({ ...form, violationDate: e.target.value })} /></label>
            <label>Assunto / observações iniciais<textarea style={{ ...fieldStyle, minHeight: 84, resize: 'vertical' }} maxLength={2000} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Resumo breve, sem inserir dados sensíveis desnecessários." /></label>
            <button className="primary-button" type="submit" disabled={saving || !form.organizationId}>{saving ? 'Salvando...' : 'Cadastrar processo'}</button>
          </form>
        </div>

        <div className="panel process-panel">
          <div className="panel-heading">
            <div><div className="eyebrow dark">ACOMPANHAMENTO</div><h2>Processos cadastrados</h2><p>Consulta e acompanhamento do fluxo administrativo.</p></div>
            <span className="step-mark">02</span>
          </div>
          <div className="filters">
            <input style={fieldStyle} value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar protocolo, requerente ou auto..." aria-label="Buscar processos" />
            <select style={fieldStyle} value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} aria-label="Filtrar por situação">
              <option value="">Todas as situações</option>
              {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </div>
          {loading ? <div className="empty-state">Carregando processos...</div> : items.length === 0 ? <div className="empty-state"><strong>Nenhum processo encontrado</strong><span>Cadastre um processo ou ajuste os filtros.</span></div> :
            <div className="process-list">{items.map((item) => <a className="process-row" href={`/processes/${item.id}`} key={item.id}>
              <div className="process-row-top"><strong>{item.protocolNumber}</strong><span className={`status status-${item.status.toLowerCase()}`}>{statusLabels[item.status]}</span></div>
              <div className="process-person">{item.applicantName}</div>
              <div className="process-meta"><span>{typeLabels[item.type]}</span><span>{item.organization.name}</span><span>{new Date(item.createdAt).toLocaleDateString('pt-BR')}</span></div>
            </a>)}</div>}
        </div>
      </section>
      <footer className="sitra-footer">SITRA IA · Protótipo de desenvolvimento · Não utilizar dados reais nesta versão.</footer>
    </main>
  );
}
