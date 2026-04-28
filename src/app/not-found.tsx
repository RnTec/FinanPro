'use client';

import Link from 'next/link';
import { Home, AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="error-page">
      <div className="error-card animate-slide">
        <div className="error-icon">
          <AlertCircle size={60} />
        </div>
        <h1 className="error-title">404</h1>
        <h2 className="error-subtitle">Página não encontrada</h2>
        <p className="error-text">
          Ops! Parece que você se perdeu no labirinto financeiro. 
          A página que você procura não existe ou foi movida.
        </p>
        <Link href="/dashboard" className="btn btn-primary">
          <Home size={18} /> Voltar ao Dashboard
        </Link>
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
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .error-icon {
          color: var(--blue);
          margin-bottom: 24px;
          display: flex;
          justify-content: center;
          animation: bounce 2s infinite;
        }
        .error-title {
          font-size: 6rem;
          font-weight: 900;
          margin: 0;
          background: linear-gradient(135deg, var(--blue), #a78bfa);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          line-height: 1;
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
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
      `}</style>
    </div>
  );
}
