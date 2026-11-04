export default function Home() {
  return (
    <main style={{minHeight:'100vh',background:'#f4f7fa',color:'#102a43',fontFamily:'Arial,sans-serif',padding:40}}>
      <header style={{background:'#102a43',color:'#fff',padding:28,borderRadius:16}}>
        <p style={{letterSpacing:3,fontSize:12}}>SISTEMA INTELIGENTE DE TRÂNSITO</p>
        <h1 style={{fontSize:36,margin:'8px 0'}}>SITRA IA</h1>
        <p>Análise assistida de defesas e recursos administrativos</p>
      </header>
      <section style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(220px,1fr))',gap:16,marginTop:24}}>
        {['Processos recebidos','Em análise documental','Aguardando revisão humana','Pareceres preliminares'].map((item)=><article key={item} style={{background:'#fff',padding:24,borderRadius:12,border:'1px solid #d9e2ec'}}><p style={{fontSize:13,color:'#627d98'}}>{item}</p><strong style={{fontSize:30}}>0</strong></article>)}
      </section>
      <section style={{background:'#fff',padding:24,borderRadius:12,marginTop:20,border:'1px solid #d9e2ec'}}>
        <h2>Central de análise</h2><p>O sistema organizará documentos, evidências e referências normativas para apoiar a análise técnica.</p>
        <p style={{background:'#e8f5ef',padding:14,borderRadius:8,color:'#176b4d'}}>A inteligência artificial não toma decisões administrativas. Toda recomendação exige conferência humana por agente competente.</p>
      </section>
    </main>
  );
}
