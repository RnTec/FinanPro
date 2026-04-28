'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Trash2, Edit3, RotateCcw, Calendar, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

interface Category { id: string; name: string; color: string; }
interface RecurringBill {
  id: string; name: string; expectedAmount: number; dueDay: number;
  frequency: string; nextDueDate: string; isActive: boolean;
  category: Category | null;
}

export default function RecurringPage() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: '', expectedAmount: '', dueDay: '1', frequency: 'MONTHLY',
    nextDueDate: new Date().toISOString().split('T')[0], categoryId: '', alertDaysBefore: '3'
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [billsRes, catsRes] = await Promise.all([
        fetch('/api/recurring'),
        fetch('/api/categories')
      ]);
      if (billsRes.ok) setBills(await billsRes.json());
      if (catsRes.ok) setCategories((await catsRes.json()).filter((c: any) => c.type === 'EXPENSE'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/recurring/${editId}` : '/api/recurring';
    try {
      const res = await fetch(url, {
        method: editId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) { setShowModal(false); resetForm(); fetchData(); }
    } catch (err) { console.error(err); }
  };

  const handlePay = async (id: string) => {
    if (!confirm('Deseja registrar o pagamento desta conta agora?')) return;
    try {
      const res = await fetch(`/api/recurring/${id}/pay`, { method: 'POST' });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta conta recorrente?')) return;
    try {
      const res = await fetch(`/api/recurring/${id}`, { method: 'DELETE' });
      if (res.ok) fetchData();
    } catch (err) { console.error(err); }
  };

  const handleEdit = (bill: RecurringBill) => {
    setForm({
      name: bill.name, expectedAmount: String(bill.expectedAmount),
      dueDay: String(bill.dueDay), frequency: bill.frequency,
      nextDueDate: new Date(bill.nextDueDate).toISOString().split('T')[0],
      categoryId: bill.category?.id || '', alertDaysBefore: '3'
    });
    setEditId(bill.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ name: '', expectedAmount: '', dueDay: '1', frequency: 'MONTHLY', nextDueDate: new Date().toISOString().split('T')[0], categoryId: '', alertDaysBefore: '3' });
    setEditId(null);
  };

  const getStatus = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    due.setHours(0, 0, 0, 0);

    if (due < today) return { label: 'Atrasado', color: 'var(--red)', icon: <AlertCircle size={14} /> };
    if (due.getTime() === today.getTime()) return { label: 'Vence Hoje', color: 'var(--yellow)', icon: <Clock size={14} /> };
    return { label: 'Próximo', color: 'var(--blue)', icon: <Calendar size={14} /> };
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Contas Recorrentes</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{bills.length} contas automáticas configuradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
          <Plus size={18} /> Nova Conta
        </button>
      </div>

      <div className="page-content animate-fade">
        {loading ? (
          <div className="card">{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: '80px', marginBottom: '12px' }} />)}</div>
        ) : bills.length === 0 ? (
          <div className="card empty-state">
            <RotateCcw size={48} />
            <h3>Nenhuma conta recorrente</h3>
            <p>Cadastre suas contas fixas (aluguel, internet, assinaturas) para ter controle total.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {bills.map(bill => {
              const status = getStatus(bill.nextDueDate);
              return (
                <div key={bill.id} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', borderLeft: `4px solid ${status.color}` }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600 }}>{bill.name}</span>
                      <span className="badge" style={{ backgroundColor: `${status.color}20`, color: status.color, display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {status.icon} {status.label}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '12px' }}>
                      <span>Vence: <strong>{formatDate(bill.nextDueDate)}</strong></span>
                      <span>•</span>
                      <span>Frequência: {bill.frequency === 'MONTHLY' ? 'Mensal' : 'Anual'}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)' }}>{formatCurrency(bill.expectedAmount)}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Valor estimado</div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '12px', paddingLeft: '20px', borderLeft: '1px solid var(--border)' }}>
                    <button className="btn btn-primary btn-sm" onClick={() => handlePay(bill.id)} title="Marcar como pago">
                      <CheckCircle2 size={16} /> <span className="hide-mobile">Pagar</span>
                    </button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(bill)}><Edit3 size={16} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(bill.id)}><Trash2 size={16} /></button>
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
              <h2>{editId ? 'Editar Conta' : 'Nova Conta Recorrente'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome da Conta</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Ex: Aluguel, Netflix..." />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Valor Esperado</label>
                  <input type="number" step="0.01" className="form-input" value={form.expectedAmount} onChange={(e) => setForm({ ...form, expectedAmount: e.target.value })} required placeholder="0,00" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dia do Vencimento</label>
                  <input type="number" min="1" max="31" className="form-input" value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Frequência</label>
                  <select className="form-select" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })}>
                    <option value="MONTHLY">Mensal</option>
                    <option value="YEARLY">Anual</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Selecionar...</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Próximo Vencimento</label>
                <input type="date" className="form-input" value={form.nextDueDate} onChange={(e) => setForm({ ...form, nextDueDate: e.target.value })} required />
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar Alterações' : 'Cadastrar Conta'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
