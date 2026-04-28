'use client';

import { useState } from 'react';
import { Sparkles, TrendingDown, TrendingUp, Lightbulb, ShieldCheck, Loader2, RefreshCw, Printer } from 'lucide-react';

interface InsightData {
  generalStatus: string;
  keyObservations: string[];
  savingTips: string[];
  score: number;
}

export default function InsightsPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<InsightData | null>(null);

  const generateInsights = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/insights', { method: 'POST' });
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Insights com IA</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Análise preditiva e sugestões personalizadas</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          {data && (
            <button className="btn btn-secondary" onClick={() => window.print()}>
              <Printer size={18} /> Imprimir Relatório
            </button>
          )}
          <button className="btn btn-primary" onClick={generateInsights} disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {data ? 'Recalcular Insights' : 'Gerar Insights'}
          </button>
        </div>
      </div>

      <div className="page-content animate-fade">
        {!data && !loading ? (
          <div className="card empty-state" style={{ padding: '60px 20px' }}>
            <div className="ai-icon-large">
              <Sparkles size={48} />
            </div>
            <h3>Sua IA Financeira está pronta</h3>
            <p style={{ maxWidth: '450px', margin: '0 auto 24px' }}>
              Nossa inteligência artificial analisa seus padrões de gastos, receitas e contas recorrentes para fornecer um diagnóstico completo da sua saúde financeira.
            </p>
            <button className="btn btn-primary" onClick={generateInsights}>Começar Análise</button>
          </div>
        ) : loading ? (
          <div className="loading-state">
            <div className="ai-pulse"></div>
            <div style={{ marginTop: '24px', textAlign: 'center' }}>
              <h3 className="animate-pulse">Analisando suas finanças...</h3>
              <p style={{ color: 'var(--text-muted)' }}>Isso pode levar alguns segundos.</p>
            </div>
          </div>
        ) : (
          <div className="insights-grid">
            {/* Score Card */}
            <div className="card score-card animate-slide">
              <div className="score-header">
                <h3>Saúde Financeira</h3>
                <div className="score-badge" style={{ color: data!.score > 70 ? 'var(--green)' : 'var(--yellow)' }}>{data!.score}</div>
              </div>
              <div className="progress-bar-bg" style={{ height: '12px' }}>
                <div className="progress-bar-fill" style={{ width: `${data!.score}%`, backgroundColor: data!.score > 70 ? 'var(--green)' : 'var(--yellow)' }}></div>
              </div>
              <p style={{ marginTop: '16px', fontWeight: 600, fontSize: '1.1rem' }}>{data!.generalStatus}</p>
            </div>

            {/* Observations */}
            <div className="card animate-slide" style={{ animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <ShieldCheck size={20} color="var(--blue)" />
                <h3 style={{ margin: 0 }}>Observações Chave</h3>
              </div>
              <ul className="insight-list">
                {data!.keyObservations.map((obs, i) => (
                  <li key={i}>
                    <div className="bullet-blue" />
                    <span>{obs}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Savings Tips */}
            <div className="card animate-slide" style={{ animationDelay: '0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                <Lightbulb size={20} color="var(--yellow)" />
                <h3 style={{ margin: 0 }}>Dicas de Economia</h3>
              </div>
              <ul className="insight-list">
                {data!.savingTips.map((tip, i) => (
                  <li key={i}>
                    <div className="bullet-yellow" />
                    <span>{tip}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .insights-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 1024px) {
          .insights-grid {
            grid-template-columns: 1fr 1fr;
          }
          .score-card {
            grid-column: span 2;
          }
        }
        .ai-icon-large {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: var(--blue-bg);
          color: var(--blue);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
          animation: float 3s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 80px 20px;
        }
        .ai-pulse {
          width: 60px;
          height: 60px;
          background: var(--blue);
          border-radius: 50%;
          animation: pulse-ai 2s infinite;
        }
        @keyframes pulse-ai {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.7); }
          70% { box-shadow: 0 0 0 30px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        .score-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .score-badge {
          font-size: 2.5rem;
          font-weight: 800;
        }
        .insight-list {
          list-style: none;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .insight-list li {
          display: flex;
          gap: 12px;
          line-height: 1.5;
        }
        .bullet-blue { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); margin-top: 6px; flex-shrink: 0; }
        .bullet-yellow { width: 8px; height: 8px; border-radius: 50%; background: var(--yellow); margin-top: 6px; flex-shrink: 0; }
        .progress-bar-bg { background: var(--bg-input); border-radius: 6px; overflow: hidden; }
        .progress-bar-fill { height: 100%; transition: width 1s ease-out; }

        @media print {
          .sidebar, .page-header button, .btn { display: none !important; }
          .main-content { padding: 0 !important; margin: 0 !important; }
          .card { border: 1px solid #eee !important; box-shadow: none !important; break-inside: avoid; }
          body { background: white !important; color: black !important; }
          h1, h2, h3 { color: black !important; }
          .score-badge { color: black !important; border: 2px solid black; padding: 10px; border-radius: 8px; }
          .progress-bar-bg { border: 1px solid #ccc; }
          .progress-bar-fill { background: #333 !important; }
          .bullet-blue, .bullet-yellow { border: 1px solid black; }
        }
      `}</style>
    </>
  );
}
