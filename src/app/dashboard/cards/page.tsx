'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Trash2, Edit3, CreditCard, Wallet, Calendar, AlertCircle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Card {
  id: string; name: string; brand: string; lastFourDigits: string;
  creditLimit: number; closingDay: number; dueDay: number;
  color: string; isActive: boolean; currentInvoice: number;
}

export default function CardsPage() {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', brand: 'Visa', lastFourDigits: '',
    creditLimit: '', closingDay: '1', dueDay: '10', color: '#6366f1'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cards');
      if (res.ok) setCards(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/cards/${editId}` : '/api/cards';
    try {
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) { setShowModal(false); resetForm(); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cartão? Todas as transações vinculadas perderão o vínculo.')) return;
    try {
      const res = await fetch(`/api/cards/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setForm({ name: '', brand: 'Visa', lastFourDigits: '', creditLimit: '', closingDay: '1', dueDay: '10', color: '#6366f1' });
    setEditId(null);
  };

  const COLORS = ['#1e293b', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#10b981', '#0ea5e9'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Cartões de Crédito</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gerencie seus limites e faturas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} /> Novo Cartão
        </button>
      </div>

      <div className="page-content animate-fade">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {[1,2].map(i => <div key={i} className="card skeleton" style={{ height: '200px' }} />)}
          </div>
        ) : cards.length === 0 ? (
          <div className="card empty-state">
            <CreditCard size={48} />
            <h3>Nenhum cartão cadastrado</h3>
            <p>Adicione seus cartões para controlar faturas e parcelamentos.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
            {cards.map(card => {
              const usedPercentage = (card.currentInvoice / card.creditLimit) * 100;
              return (
                <div key={card.id} className="card-wrapper">
                  <div className="visual-card" style={{ background: `linear-gradient(135deg, ${card.color}, ${card.color}dd)` }}>
                    <div className="card-chip"></div>
                    <div className="card-brand">{card.brand}</div>
                    <div className="card-number">**** **** **** {card.lastFourDigits || '0000'}</div>
                    <div className="card-holder">{card.name}</div>
                    <div className="card-info-row">
                      <div>
                        <div className="card-info-label">FECHAMENTO</div>
                        <div className="card-info-value">DIA {card.closingDay}</div>
                      </div>
                      <div>
                        <div className="card-info-label">VENCIMENTO</div>
                        <div className="card-info-value">DIA {card.dueDay}</div>
                      </div>
                    </div>
                  </div>

                  <div className="card-stats">
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fatura Atual</span>
                      <span style={{ fontWeight: 700, color: 'var(--red)' }}>{formatCurrency(card.currentInvoice)}</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${Math.min(usedPercentage, 100)}%`, backgroundColor: usedPercentage > 80 ? 'var(--red)' : 'var(--blue)' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      <span>Limite: {formatCurrency(card.creditLimit)}</span>
                      <span>Disponível: {formatCurrency(card.creditLimit - card.currentInvoice)}</span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
                      <button className="btn btn-secondary btn-sm btn-full" onClick={() => { setEditId(card.id); setForm({ ...card, creditLimit: String(card.creditLimit), closingDay: String(card.closingDay), dueDay: String(card.dueDay) }); setShowModal(true); }}>
                        <Edit3 size={14} /> Editar
                      </button>
                      <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(card.id)}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-slide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Editar Cartão' : 'Novo Cartão de Crédito'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome no Cartão / Apelido</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Nubank, Visa Infinite..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Bandeira</label>
                  <select className="form-select" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
                    <option value="Visa">Visa</option>
                    <option value="Mastercard">Mastercard</option>
                    <option value="Elo">Elo</option>
                    <option value="Amex">Amex</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Últimos 4 dígitos</label>
                  <input type="text" maxLength={4} className="form-input" value={form.lastFourDigits} onChange={(e) => setForm({ ...form, lastFourDigits: e.target.value })} placeholder="0000" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Limite de Crédito</label>
                <input type="number" step="0.01" className="form-input" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} required placeholder="0,00" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Dia de Fechamento</label>
                  <input type="number" min="1" max="31" className="form-input" value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Dia de Vencimento</label>
                  <input type="number" min="1" max="31" className="form-input" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Cor do Cartão</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', backgroundColor: c, border: form.color === c ? '2px solid white' : 'none', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Cartão</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .card-wrapper {
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        .visual-card {
          height: 180px;
          border-radius: 16px;
          padding: 24px;
          color: white;
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: 0 10px 20px rgba(0,0,0,0.2);
          z-index: 1;
        }
        .card-chip {
          width: 40px;
          height: 30px;
          background: linear-gradient(135deg, #ffd700, #b8860b);
          border-radius: 4px;
        }
        .card-brand {
          position: absolute;
          top: 24px;
          right: 24px;
          font-weight: 800;
          font-style: italic;
          font-size: 1.2rem;
          opacity: 0.8;
        }
        .card-number {
          font-family: monospace;
          font-size: 1.2rem;
          letter-spacing: 2px;
        }
        .card-holder {
          text-transform: uppercase;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 1px;
        }
        .card-info-row {
          display: flex;
          gap: 24px;
        }
        .card-info-label {
          font-size: 0.6rem;
          opacity: 0.7;
          margin-bottom: 2px;
        }
        .card-info-value {
          font-size: 0.75rem;
          font-weight: 700;
        }
        .card-stats {
          background: var(--bg-card);
          border: 1px solid var(--border);
          border-top: none;
          border-radius: 0 0 16px 16px;
          padding: 20px;
          padding-top: 30px;
          margin-top: -20px;
        }
        .progress-bar-bg {
          height: 6px;
          background: var(--bg-input);
          border-radius: 3px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          transition: width 0.5s ease-out;
        }
      `}</style>
    </>
  );
}
