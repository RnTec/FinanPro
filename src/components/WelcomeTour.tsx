'use client';

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, LayoutDashboard, ArrowLeftRight, TrendingUp } from 'lucide-react';

const steps = [
  {
    title: "Bem-vindo ao FinanPro! 🚀",
    content: "Sua jornada rumo à liberdade financeira começa aqui. Vamos fazer um tour rápido pelas principais ferramentas?",
    icon: <Sparkles size={40} className="text-yellow-500" />,
  },
  {
    title: "Dashboard Inteligente",
    content: "Aqui você tem uma visão 360º do seu dinheiro. Acompanhe receitas, despesas e seu patrimônio líquido em tempo real.",
    icon: <LayoutDashboard size={40} className="text-blue-500" />,
  },
  {
    title: "IA & Automação",
    content: "Use sua voz ou fotos de recibos para lançar gastos. Nossa IA categoriza tudo automaticamente para você.",
    icon: <Sparkles size={40} className="text-purple-500" />,
  },
  {
    title: "Insights Preditivos",
    content: "A cada transação, nossa IA aprende seu comportamento e dá dicas reais de como economizar e investir melhor.",
    icon: <TrendingUp size={40} className="text-green-500" />,
  },
  {
    title: "Tudo Pronto!",
    content: "Explore as abas de Cartões, Metas e Contas Recorrentes para ter o controle total. Bom planejamento!",
    icon: <ArrowLeftRight size={40} className="text-blue-500" />,
  }
];

export default function WelcomeTour() {
  const [currentStep, setCurrentStep] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkTour = async () => {
      const res = await fetch('/api/user/tour');
      const data = await res.json();
      if (!data.hasSeenTour) {
        setIsVisible(true);
      }
    };
    checkTour();
  }, []);

  const handleFinish = async () => {
    setIsVisible(false);
    await fetch('/api/user/tour', { method: 'POST' });
  };

  if (!isVisible) return null;

  return (
    <div className="tour-overlay animate-fade">
      <div className="tour-card animate-slide">
        <button className="tour-close" onClick={handleFinish}><X size={20} /></button>
        
        <div className="tour-icon-container">
          {steps[currentStep].icon}
        </div>

        <h2 className="tour-title">{steps[currentStep].title}</h2>
        <p className="tour-text">{steps[currentStep].content}</p>

        <div className="tour-footer">
          <div className="tour-dots">
            {steps.map((_, i) => (
              <div key={i} className={`tour-dot ${i === currentStep ? 'active' : ''}`} />
            ))}
          </div>
          <div className="tour-actions">
            {currentStep > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={() => setCurrentStep(currentStep - 1)}>
                <ChevronLeft size={18} /> Anterior
              </button>
            )}
            <button 
              className="btn btn-primary btn-sm" 
              onClick={currentStep === steps.length - 1 ? handleFinish : () => setCurrentStep(currentStep + 1)}
            >
              {currentStep === steps.length - 1 ? 'Começar Agora' : 'Próximo'} 
              {currentStep < steps.length - 1 && <ChevronRight size={18} />}
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        .tour-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .tour-card {
          background: #1e1e2e;
          width: 100%;
          max-width: 450px;
          border-radius: 24px;
          padding: 40px;
          position: relative;
          text-align: center;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
        }
        .tour-close {
          position: absolute;
          top: 20px;
          right: 20px;
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          transition: color 0.2s;
        }
        .tour-close:hover { color: white; }
        .tour-icon-container {
          width: 80px;
          height: 80px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 24px;
        }
        .tour-title { font-size: 1.5rem; margin-bottom: 12px; color: white; }
        .tour-text { color: var(--text-muted); line-height: 1.6; margin-bottom: 32px; font-size: 1.05rem; }
        .tour-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
          padding-top: 24px;
        }
        .tour-dots { display: flex; gap: 8px; }
        .tour-dot { width: 8px; height: 8px; border-radius: 50%; background: rgba(255,255,255,0.1); }
        .tour-dot.active { background: var(--blue); width: 24px; border-radius: 4px; }
        .tour-actions { display: flex; gap: 12px; }
      `}</style>
    </div>
  );
}
