'use client';

import { useEffect, useState, useCallback } from 'react';
import { Plus, X, Trash2, Edit3, Tag } from 'lucide-react';

interface SubCategory { id: string; name: string; }
interface Category { id: string; name: string; color: string; icon: string; type: string; isDefault: boolean; subCategories: SubCategory[]; _count: { transactions: number }; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filterType, setFilterType] = useState<string>('EXPENSE');
  const [form, setForm] = useState({ name: '', color: '#6366f1', icon: 'tag', type: 'EXPENSE' });
  const [editId, setEditId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/categories');
      if (res.ok) setCategories(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/categories/${editId}` : '/api/categories';
    try {
      const res = await fetch(url, { method: editId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (res.ok) { setShowModal(false); setEditId(null); setForm({ name: '', color: '#6366f1', icon: 'tag', type: 'EXPENSE' }); fetchCategories(); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta categoria?')) return;
    try { await fetch(`/api/categories/${id}`, { method: 'DELETE' }); fetchCategories(); } catch (err) { console.error(err); }
  };

  const filtered = categories.filter(c => c.type === filterType);
  const COLORS = ['#ef4444','#f97316','#f59e0b','#10b981','#06b6d4','#3b82f6','#6366f1','#8b5cf6','#a855f7','#ec4899','#14b8a6','#64748b'];

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Categorias</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{categories.length} categorias cadastradas</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setForm({ name: '', color: '#6366f1', icon: 'tag', type: filterType }); setShowModal(true); }}>
          <Plus size={18} /> Nova Categoria
        </button>
      </div>

      <div className="page-content animate-fade">
        <div className="filters-bar" style={{ marginBottom: '24px' }}>
          <button className={`filter-chip ${filterType === 'EXPENSE' ? 'active' : ''}`} onClick={() => setFilterType('EXPENSE')}>📉 Despesas</button>
          <button className={`filter-chip ${filterType === 'INCOME' ? 'active' : ''}`} onClick={() => setFilterType('INCOME')}>📈 Receitas</button>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {[1,2,3,4,5,6].map(i => <div key={i} className="card skeleton" style={{ height: '100px' }} />)}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {filtered.map(cat => (
              <div key={cat.id} className="card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: 'var(--radius)', backgroundColor: `${cat.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Tag size={22} color={cat.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{cat.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span>{cat._count.transactions} transações</span>
                    {cat.isDefault && <span className="badge badge-blue">Padrão</span>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn btn-ghost btn-icon btn-sm" onClick={() => { setEditId(cat.id); setForm({ name: cat.name, color: cat.color, icon: cat.icon, type: cat.type }); setShowModal(true); }}><Edit3 size={15} /></button>
                  {!cat.isDefault && <button className="btn btn-ghost btn-icon btn-sm" style={{ color: 'var(--red)' }} onClick={() => handleDelete(cat.id)}><Trash2 size={15} /></button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-slide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Editar' : 'Nova'} Categoria</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required placeholder="Nome da categoria" />
              </div>
              <div className="form-group">
                <label className="form-label">Tipo</label>
                <select className="form-select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option value="EXPENSE">Despesa</option>
                  <option value="INCOME">Receita</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Cor</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm({ ...form, color: c })}
                      style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'var(--transition)' }} />
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar' : 'Criar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
