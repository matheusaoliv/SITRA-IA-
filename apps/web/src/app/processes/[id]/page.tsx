'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

type ProcessData = {
  id: string; protocolNumber: string; type: string; status: string; applicantName: string;
  infractionNoticeNumber?: string | null; violationDate?: string | null; receivedAt: string;
  subject?: string | null; createdAt: string; updatedAt: string;
  organization: { id: string; name: string; code?: string | null };
  documents: Array<{ id: string; fileName: string; mimeType: string; uploadedAt: string }>;
  opinions: Array<{ id: string; recommendation: string; summary: string; createdAt: string }>;
  decisions: Array<{ id: string; outcome: string; justification: string; decidedAt: string }>;
};
const API = (process.env.NEXT_PUBLIC_SITRA_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
const statusLabels: Record<string, string> = { RECEBIDO: 'Recebido', EM_TRIAGEM: 'Em triagem', EM_ANALISE: 'Em análise', AGUARDANDO_REVISAO: 'Aguardando revisão', DECIDIDO: 'Decidido', ARQUIVADO: 'Arquivado' };
const typeLabels: Record<string, string> = { DEFESA_PREVIA: 'Defesa prévia', JARI: 'Recurso à JARI', CETRAN: 'Recurso ao CETRAN' };
const transitions: Record<string, string[]> = { RECEBIDO: ['EM_TRIAGEM'], EM_TRIAGEM: ['EM_ANALISE'], EM_ANALISE: ['AGUARDANDO_REVISAO'], AGUARDANDO_REVISAO: [], DECIDIDO: [], ARQUIVADO: [] };

export default function ProcessDetailPage() {
  const params = useParams<{ id: string }>();
  const [process, setProcess] = useState<ProcessData | null>(null);
  const [nextStatus, setNextStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  async function load() {
    setLoading(true); setError('');
    try {
      const response = await fetch(`${API}/processes/${params.id}`, { credentials: 'include' });
      const data = await response.json();
      if (response.status === 401) { window.location.assign('/sign-in'); return; }
      if (!response.ok) throw new Error(data.message || 'Não foi possível localizar o processo.');
      setProcess(data);
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha de comunicação com a API.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { if (params.id) load(); }, [params.id]);

  async function changeStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!nextStatus) return;
    setSaving(true); setError(''); setNotice('');
    try {
      const response = await fetch(`${API}/processes/${params.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: nextStatus }),
      });
      const data = await response.json();
      if (response.status === 401) { window.location.assign('/sign-in'); return; }
      if (!response.ok) throw new Error(data.message || 'Não foi possível atualizar a situação.');
      setProcess((current) => current ? { ...current, ...data } : data);
      setNextStatus(''); setNotice('Situação atualizada e registrada na trilha de auditoria.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Falha ao atualizar situação.'); }
    finally { setSaving(false); }
  }

  if (loading) return <main className="detail-shell"><p>Carregando processo...</p></main>;
  if (!process) return <main className="detail-shell"><a className="back-link" href="/">← Voltar aos processos</a><div className="detail-card"><h1>Processo indisponível</h1><p>{error || 'Não foi possível carregar os dados.'}</p></div></main>;

  const allowed = transitions[process.status] || [];
  return <main className="detail-shell">
    <a className="back-link" href="/">← Voltar aos processos</a>
    {error && <div className="alert alert-error">{error}</div>}
    {notice && <div className="alert alert-success">{notice}</div>}
    <section className="detail-card">
      <div className="detail-title">
        <div><div className="eyebrow dark">FICHA DO PROCESSO</div><h1>{process.protocolNumber}</h1><p>{typeLabels[process.type] || process.type} · {process.organization.name}</p></div>
        <span className={`status status-${process.status.toLowerCase()}`}>{statusLabels[process.status] || process.status}</span>
      </div>
      <div className="detail-grid">
        <div className="detail-field"><span>Requerente</span><strong>{process.applicantName}</strong></div>
        <div className="detail-field"><span>Órgão responsável</span><strong>{process.organization.name}{process.organization.code ? ` · ${process.organization.code}` : ''}</strong></div>
        <div className="detail-field"><span>Auto de infração</span><strong>{process.infractionNoticeNumber || 'Não informado'}</strong></div>
        <div className="detail-field"><span>Data da infração</span><strong>{process.violationDate ? new Date(process.violationDate).toLocaleDateString('pt-BR') : 'Não informada'}</strong></div>
        <div className="detail-field"><span>Data de protocolo</span><strong>{new Date(process.receivedAt).toLocaleString('pt-BR')}</strong></div>
        <div className="detail-field"><span>Última atualização</span><strong>{new Date(process.updatedAt).toLocaleString('pt-BR')}</strong></div>
      </div>
    </section>

    <section className="detail-card">
      <h2 className="detail-section-title">Andamento administrativo</h2>
      <p style={{ color: '#627d98', fontSize: 13, lineHeight: 1.6 }}>As alterações de situação são limitadas ao fluxo previsto. A situação “Decidido” não pode ser atribuída por este módulo: dependerá do registro de decisão humana competente.</p>
      {allowed.length > 0 ? <form className="status-update" onSubmit={changeStatus}>
        <select aria-label="Próxima situação" value={nextStatus} onChange={(e) => setNextStatus(e.target.value)}>
          <option value="">Selecione a próxima etapa</option>
          {allowed.map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}
        </select>
        <button className="primary-button" disabled={!nextStatus || saving}>{saving ? 'Atualizando...' : 'Atualizar andamento'}</button>
      </form> : <div className="empty-state">Não há transição disponível nesta etapa.</div>}
    </section>

    <section className="detail-card">
      <h2 className="detail-section-title">Observações iniciais</h2>
      <div className="detail-note">{process.subject || 'Nenhuma observação registrada.'}</div>
    </section>

    <section className="detail-card">
      <h2 className="detail-section-title">Documentos</h2>
      {process.documents.length ? process.documents.map((doc) => <div key={doc.id} className="process-row"><strong>{doc.fileName}</strong><div className="process-meta"><span>{doc.mimeType}</span><span>{new Date(doc.uploadedAt).toLocaleDateString('pt-BR')}</span></div></div>) : <div className="empty-state">Nenhum documento anexado. O módulo de PDF será implementado na próxima etapa.</div>}
    </section>

    <section className="detail-card">
      <h2 className="detail-section-title">Pareceres preliminares de IA</h2>
      {process.opinions.length ? process.opinions.map((opinion) => <div key={opinion.id} className="process-row"><strong>{opinion.recommendation}</strong><p>{opinion.summary}</p><div className="process-meta">{new Date(opinion.createdAt).toLocaleString('pt-BR')}</div></div>) : <div className="empty-state">Ainda não existem pareceres. A análise por IA será habilitada após a implementação documental e da base jurídica.</div>}
    </section>

    <section className="detail-card">
      <h2 className="detail-section-title">Decisão administrativa</h2>
      {process.decisions.length ? process.decisions.map((decision) => <div key={decision.id} className="process-row"><strong>{decision.outcome}</strong><p>{decision.justification}</p><div className="process-meta">{new Date(decision.decidedAt).toLocaleString('pt-BR')}</div></div>) : <div className="empty-state">Nenhuma decisão humana registrada.</div>}
    </section>
  </main>;
}
