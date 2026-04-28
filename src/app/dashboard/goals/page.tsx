'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Trash2, Edit3, Target, TrendingUp, Calendar, CheckCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Goal {
  id: string; name: string; targetAmount: number; currentAmount: number;
  deadline: string | null; icon: string; color: string; isCompleted: boolean;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', targetAmount: '', currentAmount: '0',
    deadline: '', icon: 'target', color: '#10b981'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/goals');
      if (res.ok) setGoals(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/goals/${editId}` : '/api/goals';
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
    if (!confirm('Excluir esta meta?')) return;
    try {
      const res = await fetch(`/api/goals/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const resetForm = () => {
    setForm({ name: '', targetAmount: '', currentAmount: '0', deadline: '', icon: 'target', color: '#10b981' });
    setEditId(null);
  };

  const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Metas Financeiras</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Planeje e conquiste seus objetivos</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} /> Nova Meta
        </button>
      </div>

      <div className="page-content animate-fade">
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {[1,2,3].map(i => <div key={i} className="card skeleton" style={{ height: '180px' }} />)}
          </div>
        ) : goals.length === 0 ? (
          <div className="card empty-state">
            <Target size={48} />
            <h3>Nenhuma meta definida</h3>
            <p>Defina objetivos como "Reserva de Emergência" ou "Viagem" para acompanhar seu progresso.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
            {goals.map(goal => {
              const progress = (goal.currentAmount / goal.targetAmount) * 100;
              const remaining = goal.targetAmount - goal.currentAmount;
              
              return (
                <div key={goal.id} className="card goal-card" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: `${goal.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Target color={goal.color} size={24} />
                    </div>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditId(goal.id); setForm({ ...goal, targetAmount: String(goal.targetAmount), currentAmount: String(goal.currentAmount), deadline: goal.deadline ? goal.deadline.split('T')[0] : '' }); setShowModal(true); }}><Edit3 size={15} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(goal.id)}><Trash2 size={15} /></button>
                    </div>
                  </div>

                  <h3 style={{ marginBottom: '4px' }}>{goal.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '20px', display: 'flex', gap: '8px' }}>
                    <Calendar size={14} /> 
                    {goal.deadline ? `Prazo: ${formatDate(goal.deadline)}` : 'Sem prazo definido'}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.9rem' }}>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(goal.currentAmount)}</span>
                    <span style={{ color: 'var(--text-muted)' }}>de {formatCurrency(goal.targetAmount)}</span>
                  </div>

                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: goal.color }}></div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.8rem' }}>
                    <span style={{ color: goal.color, fontWeight: 600 }}>{progress.toFixed(1)}%</span>
                    <span style={{ color: 'var(--text-muted)' }}>Faltam {formatCurrency(remaining > 0 ? remaining : 0)}</span>
                  </div>

                  {progress >= 100 && (
                    <div style={{ marginTop: '16px', padding: '8px', borderRadius: '8px', backgroundColor: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600 }}>
                      <CheckCircle size={16} /> Meta Atingida!
                    </div>
                  )}
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
              <h2>{editId ? 'Editar Meta' : 'Nova Meta Financeira'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome da Meta</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Reserva de Emergência, Carro Novo..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Valor Alvo</label>
                  <input type="number" step="0.01" className="form-input" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} required placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Valor Já Guardado</label>
                  <input type="number" step="0.01" className="form-input" value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} placeholder="0,00" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Prazo (Opcional)</label>
                <input type="date" className="form-input" value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div className="form-group">
                <label className="form-label">Cor</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      style={{ width: '32px', height: '32px', borderRadius: 'var(--radius)', backgroundColor: c, border: form.color === c ? '2px solid white' : 'none', cursor: 'pointer' }} />
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .progress-bar-bg {
          height: 8px;
          background: var(--bg-input);
          border-radius: 4px;
          overflow: hidden;
        }
        .progress-bar-fill {
          height: 100%;
          transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .goal-card:hover {
          transform: translateY(-4px);
          border-color: var(--blue);
        }
      `}</style>
    </>
  );
}
