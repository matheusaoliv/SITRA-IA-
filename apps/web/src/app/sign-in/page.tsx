'use client';
import { FormEvent, useState } from 'react';
const API = (process.env.NEXT_PUBLIC_SITRA_API_URL || 'http://localhost:3001/api/v1').replace(/\/$/, '');
export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API}/auth/login`, {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'Não foi possível entrar.');
      const next = new URLSearchParams(window.location.search).get('next');
      window.location.assign(next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Falha de comunicação com o servidor.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="auth-shell">
      <section className="auth-card">
        <div className="auth-brand"><span>SITRA</span><strong>IA</strong></div>
        <div className="eyebrow dark">ACESSO INSTITUCIONAL</div>
        <h1>Entrar no sistema</h1>
        <p className="auth-description">Utilize suas credenciais institucionais para acessar os processos autorizados ao seu perfil.</p>
        {error && <div className="alert alert-error" role="alert">{error}</div>}
        <form className="auth-form" onSubmit={submit}>
          <label>E-mail institucional
            <input type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nome@orgao.gov.br" />
          </label>
          <label>Senha
            <input type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Sua senha" />
          </label>
          <button className="primary-button" type="submit" disabled={loading}>{loading ? 'Autenticando...' : 'Entrar'}</button>
        </form>
        <div className="auth-footnote">Acesso monitorado. As operações realizadas são registradas para fins de auditoria.</div>
      </section>
    </main>
  );
}
