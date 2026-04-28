'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Plus, Search, Trash2, Edit3, Filter, X, ChevronLeft, ChevronRight, Mic, Camera, Loader2, Upload, Paperclip } from 'lucide-react';
import { formatCurrency, formatDate, getMonthName } from '@/lib/utils';
import { createWorker } from 'tesseract.js';

interface Category { id: string; name: string; color: string; icon: string; type: string; }
interface Transaction {
  id: string; amount: number; type: string; costType: string | null;
  description: string; vendor: string | null; date: string; isPaid: boolean;
  category: Category | null; attachmentUrl?: string; creditCardId?: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [month, setMonth] = useState(new Date().getMonth());
  const [year, setYear] = useState(new Date().getFullYear());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // AI & OCR State
  const [isListening, setIsListening] = useState(false);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [form, setForm] = useState({
    type: 'EXPENSE', amount: '', description: '', categoryId: '', costType: 'VARIABLE',
    vendor: '', date: new Date().toISOString().split('T')[0], notes: '', attachmentUrl: '',
    creditCardId: '',
  });

  const [cards, setCards] = useState<any[]>([]);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month: String(month), year: String(year) });
    if (filterType) params.set('type', filterType);
    if (searchTerm) params.set('search', searchTerm);
    try {
      const res = await fetch(`/api/transactions?${params}`);
      if (res.ok) { const data = await res.json(); setTransactions(data.transactions); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [month, year, filterType, searchTerm]);

  const fetchData = useCallback(async () => {
    try {
      const [catsRes, cardsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/cards')
      ]);
      if (catsRes.ok) setCategories(await catsRes.json());
      if (cardsRes.ok) setCards(await cardsRes.json());
    } catch (err) { console.error(err); }
  }, []);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);
  useEffect(() => { fetchData(); }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editId ? `/api/transactions/${editId}` : '/api/transactions';
    const method = editId ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) { setShowModal(false); resetForm(); fetchTransactions(); }
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) { setDeleteConfirm(null); fetchTransactions(); }
    } catch (err) { console.error(err); }
  };

  const handleEdit = (t: Transaction) => {
    setForm({
      type: t.type, amount: String(t.amount), description: t.description,
      categoryId: t.category?.id || '', costType: t.costType || 'VARIABLE',
      vendor: t.vendor || '', date: new Date(t.date).toISOString().split('T')[0], 
      notes: '', attachmentUrl: t.attachmentUrl || '',
      creditCardId: t.creditCardId || '',
    });
    setEditId(t.id);
    setShowModal(true);
  };

  const resetForm = () => {
    setForm({ type: 'EXPENSE', amount: '', description: '', categoryId: '', costType: 'VARIABLE', vendor: '', date: new Date().toISOString().split('T')[0], notes: '', attachmentUrl: '', creditCardId: '' });
    setEditId(null);
  };

  // AI Parsing Logic
  const parseWithAI = async (text: string) => {
    setIsProcessingAI(true);
    try {
      const res = await fetch('/api/ai/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({
          ...prev,
          amount: data.amount ? String(data.amount) : prev.amount,
          description: data.description || prev.description,
          type: data.type || prev.type,
          categoryId: data.categoryId || prev.categoryId,
          costType: data.costType || prev.costType,
          vendor: data.vendor || prev.vendor,
          date: data.date || prev.date,
        }));
        setShowModal(true);
      }
    } catch (err) {
      console.error('AI Error:', err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Audio Logic
  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Seu navegador não suporta reconhecimento de voz.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      parseWithAI(transcript);
    };

    recognition.start();
  };

  // OCR Logic
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Upload to server
    const formData = new FormData();
    formData.append('file', file);
    
    setIsProcessingAI(true);
    try {
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (uploadRes.ok) {
        const { url } = await uploadRes.json();
        setForm(prev => ({ ...prev, attachmentUrl: url }));
      }

      // 2. Perform OCR
      const worker = await createWorker('por');
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      // 3. Parse text with AI
      if (text.trim()) {
        await parseWithAI(text);
      }
    } catch (err) {
      console.error('OCR/Upload Error:', err);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const changeMonth = (dir: number) => {
    let m = month + dir, y = year;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setMonth(m); setYear(y);
  };

  const filteredCategories = categories.filter(c => c.type === form.type);
  const totalIncome = transactions.filter(t => t.type === 'INCOME').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'EXPENSE').reduce((s, t) => s + t.amount, 0);

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Transações</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {getMonthName(month)} {year} • {transactions.length} transações
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <a href="/api/transactions/export" download className="btn btn-secondary btn-icon" title="Exportar CSV">
            <Upload size={18} style={{ transform: 'rotate(180deg)' }} />
          </a>
          <button className={`btn ${isListening ? 'btn-danger' : 'btn-secondary'} btn-icon`} onClick={startListening} disabled={isProcessingAI}>
            {isListening ? <div className="pulse-animation"><Mic size={18} /></div> : <Mic size={18} />}
          </button>
          <button className="btn btn-secondary btn-icon" onClick={() => fileInputRef.current?.click()} disabled={isProcessingAI}>
            {isProcessingAI ? <Loader2 size={18} className="animate-spin" /> : <Camera size={18} />}
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" style={{ display: 'none' }} />
          <button className="btn btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus size={18} /> Nova Transação
          </button>
        </div>
      </div>

      <div className="page-content animate-fade">
        {/* Status indicator for AI processing */}
        {isProcessingAI && (
          <div className="card" style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', borderColor: 'var(--blue)' }}>
            <Loader2 className="animate-spin" color="var(--blue)" />
            <span>Processando com inteligência artificial...</span>
          </div>
        )}

        {/* Summary mini cards */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="card" style={{ flex: 1, minWidth: '180px', padding: '16px' }}>
            <div className="stat-label">Receitas</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--green)' }}>{formatCurrency(totalIncome)}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: '180px', padding: '16px' }}>
            <div className="stat-label">Despesas</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--red)' }}>{formatCurrency(totalExpense)}</div>
          </div>
          <div className="card" style={{ flex: 1, minWidth: '180px', padding: '16px' }}>
            <div className="stat-label">Saldo</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, color: totalIncome - totalExpense >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatCurrency(totalIncome - totalExpense)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="filters-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => changeMonth(-1)}><ChevronLeft size={18} /></button>
            <span style={{ fontWeight: 600, minWidth: '140px', textAlign: 'center' }}>{getMonthName(month)} {year}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={() => changeMonth(1)}><ChevronRight size={18} /></button>
          </div>

          <button className={`filter-chip ${!filterType ? 'active' : ''}`} onClick={() => setFilterType('')}>
            <Filter size={14} /> Todos
          </button>
          <button className={`filter-chip ${filterType === 'INCOME' ? 'active' : ''}`} onClick={() => setFilterType('INCOME')}>
            📈 Receitas
          </button>
          <button className={`filter-chip ${filterType === 'EXPENSE' ? 'active' : ''}`} onClick={() => setFilterType('EXPENSE')}>
            📉 Despesas
          </button>

          <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: '36px', height: '36px', fontSize: '0.85rem' }} placeholder="Buscar transação..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {/* Transaction List */}
        {loading ? (
          <div className="card">{[1,2,3,4,5].map(i => <div key={i} className="skeleton" style={{ height: '60px', marginBottom: '8px' }} />)}</div>
        ) : transactions.length === 0 ? (
          <div className="card empty-state">
            <h3>Nenhuma transação encontrada</h3>
            <p>Adicione sua primeira transação clicando no botão acima ou usando o microfone.</p>
          </div>
        ) : (
          <div className="card" style={{ padding: '8px 0' }}>
            <div className="transaction-list" style={{ padding: '0 20px' }}>
              {transactions.map((t) => (
                <div key={t.id} className="transaction-item">
                  <div className="transaction-icon" style={{ backgroundColor: t.category?.color ? `${t.category.color}20` : 'var(--bg-input)' }}>
                    <span>{t.type === 'INCOME' ? '📈' : '📉'}</span>
                  </div>
                  <div className="transaction-info">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div className="transaction-desc">{t.description}</div>
                      {t.attachmentUrl && <Paperclip size={14} style={{ color: 'var(--blue)' }} />}
                    </div>
                    <div className="transaction-meta">
                      {t.category && (
                        <><span className="category-dot" style={{ backgroundColor: t.category.color }} /><span>{t.category.name}</span><span>•</span></>
                      )}
                      <span>{formatDate(t.date)}</span>
                      {t.costType && <><span>•</span><span className={`badge ${t.costType === 'FIXED' ? 'badge-blue' : t.costType === 'TAX' ? 'badge-yellow' : 'badge-green'}`}>{t.costType === 'FIXED' ? 'Fixo' : t.costType === 'TAX' ? 'Imposto' : 'Variável'}</span></>}
                    </div>
                  </div>
                  <div className={`transaction-amount ${t.type === 'INCOME' ? 'amount-income' : 'amount-expense'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                  <div className="transaction-actions">
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleEdit(t)}><Edit3 size={15} /></button>
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(t.id)} style={{ color: 'var(--red)' }}><Trash2 size={15} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal animate-slide" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editId ? 'Editar Transação' : 'Nova Transação'}</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Type Toggle */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className={`btn btn-full ${form.type === 'EXPENSE' ? '' : 'btn-secondary'}`}
                  style={form.type === 'EXPENSE' ? { background: 'var(--red-bg)', color: 'var(--red)', border: '1px solid rgba(239,68,68,0.3)' } : {}}
                  onClick={() => setForm({ ...form, type: 'EXPENSE', categoryId: '' })}>
                  📉 Despesa
                </button>
                <button type="button" className={`btn btn-full ${form.type === 'INCOME' ? '' : 'btn-secondary'}`}
                  style={form.type === 'INCOME' ? { background: 'var(--green-bg)', color: 'var(--green)', border: '1px solid rgba(16,185,129,0.3)' } : {}}
                  onClick={() => setForm({ ...form, type: 'INCOME', categoryId: '' })}>
                  📈 Receita
                </button>
              </div>

              <div className="form-group">
                <label className="form-label">Valor (R$)</label>
                <input type="number" step="0.01" className="form-input" placeholder="0,00" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} required style={{ fontSize: '1.3rem', fontWeight: 700 }} />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <input type="text" className="form-input" placeholder="Ex: Supermercado, Salário..." value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Categoria</label>
                  <select className="form-select" value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                    <option value="">Selecionar...</option>
                    {filteredCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Tipo de Custo</label>
                  <select className="form-select" value={form.costType} onChange={(e) => setForm({ ...form, costType: e.target.value })}>
                    <option value="VARIABLE">Variável</option>
                    <option value="FIXED">Fixo</option>
                    <option value="TAX">Imposto</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Data</label>
                  <input type="date" className="form-input" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Cartão (Opcional)</label>
                  <select className="form-select" value={form.creditCardId} onChange={(e) => setForm({ ...form, creditCardId: e.target.value })}>
                    <option value="">Dinheiro / Pix</option>
                    {cards.map(card => <option key={card.id} value={card.id}>{card.name} (..{card.lastFourDigits})</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Fornecedor</label>
                <input type="text" className="form-input" placeholder="Opcional" value={form.vendor} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
              </div>

              {form.attachmentUrl && (
                <div className="card" style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(59,130,246,0.05)', border: '1px dashed var(--blue)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem' }}>
                    <Paperclip size={14} color="var(--blue)" />
                    <span>Recibo anexado</span>
                  </div>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setForm({ ...form, attachmentUrl: '' })}>
                    <X size={14} />
                  </button>
                </div>
              )}

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">{editId ? 'Salvar' : 'Adicionar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal animate-slide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '380px' }}>
            <h3 style={{ marginBottom: '12px' }}>⚠️ Confirmar Exclusão</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.</p>
            <div className="modal-footer" style={{ marginTop: '0' }}>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        .pulse-animation {
          animation: pulse 1.5s infinite;
          color: var(--red);
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.7; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </>
  );
}
