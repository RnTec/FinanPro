'use client';

import { useEffect } from 'react';
import { RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="error-page">
      <div className="error-card animate-slide">
        <h1 className="error-title">Eita!</h1>
        <h2 className="error-subtitle">Algo deu errado no sistema</h2>
        <p className="error-text">
          Tivemos um pequeno contratempo técnico. Nossos robôs financeiros já estão trabalhando para resolver.
        </p>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button className="btn btn-primary" onClick={() => reset()}>
            <RefreshCw size={18} /> Tentar Novamente
          </button>
          <Link href="/dashboard" className="btn btn-secondary">
            <Home size={18} /> Dashboard
          </Link>
        </div>
      </div>

      <style jsx>{`
        .error-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #0f172a;
          padding: 20px;
        }
        .error-card {
          max-width: 450px;
          text-align: center;
          padding: 60px 40px;
          background: rgba(30, 41, 59, 0.5);
          backdrop-filter: blur(12px);
          border-radius: 32px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .error-title {
          font-size: 4rem;
          font-weight: 900;
          margin: 0;
          color: var(--red);
        }
        .error-subtitle {
          font-size: 1.5rem;
          color: white;
          margin: 10px 0 20px;
        }
        .error-text {
          color: var(--text-muted);
          margin-bottom: 32px;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}
