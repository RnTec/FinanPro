'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { User, Shield, Bell, Trash2, LogOut, Save, Loader2, Globe, X, Plus } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function SettingsPage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [resetConfirm, setResetConfirm] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [form, setForm] = useState({ name: '', currency: 'BRL', theme: 'dark' });

  useEffect(() => {
    if (session?.user) {
      setForm({
        name: session.user.name || '',
        currency: 'BRL', // Simplified for demo
        theme: 'dark'
      });
    }
  }, [session]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      if (res.ok) {
        await update({ name: form.name });
        alert('Configurações salvas com sucesso!');
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleReset = async () => {
    if (resetConfirm !== 'RESET') return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/settings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'RESET' })
      });
      if (res.ok) {
        alert('Todos os seus dados foram apagados.');
        window.location.reload();
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setShowResetModal(false); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('ATENÇÃO: Importar dados irá apagar todos os seus registros atuais para substituí-los pelo backup. Deseja continuar?')) {
      e.target.value = '';
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      
      const res = await fetch('/api/user/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: json.data })
      });

      if (res.ok) {
        alert('Dados importados com sucesso! A página será reiniciada.');
        window.location.reload();
      } else {
        const err = await res.json();
        alert(`Erro: ${err.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Arquivo JSON inválido.');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Configurações</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Gerencie seu perfil e preferências</p>
        </div>
      </div>

      <div className="page-content animate-fade">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
          {/* Profile Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--blue-bg)', color: 'var(--blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <User size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Perfil e Conta</h3>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div className="form-group">
                <label className="form-label">Nome Completo</label>
                <input type="text" className="form-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">E-mail (Não editável)</label>
                <input type="email" className="form-input" value={session?.user?.email || ''} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="form-group">
                <label className="form-label">Moeda Padrão</label>
                <select className="form-select" value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                  <option value="BRL">Real (R$)</option>
                  <option value="USD">Dólar ($)</option>
                  <option value="EUR">Euro (€)</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Salvar Alterações
              </button>
            </form>
          </div>

          {/* Danger Zone */}
          <div className="card" style={{ padding: '24px', border: '1px solid var(--red-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--red-bg)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} />
              </div>
              <h3 style={{ margin: 0, color: 'var(--red)' }}>Zona de Perigo</h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Ao resetar seus dados, todas as transações, cartões, metas e contas recorrentes serão apagadas permanentemente. Esta ação não pode ser desfeita.
            </p>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-danger" onClick={() => setShowResetModal(true)}>Resetar Todos os Dados</button>
              <button className="btn btn-secondary" onClick={() => signOut()}>
                <LogOut size={18} /> Sair da Conta
              </button>
            </div>
          </div>

          {/* Data Portability Section */}
          <div className="card" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'var(--green-bg)', color: 'var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={20} />
              </div>
              <h3 style={{ margin: 0 }}>Portabilidade de Dados</h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '20px' }}>
              Exporte seus dados para backup ou importe um arquivo gerado anteriormente. Seus dados pertencem a você.
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button 
                className="btn btn-secondary" 
                onClick={async () => {
                  const res = await fetch('/api/user/export');
                  const data = await res.json();
                  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `finanpro-backup-${new Date().toISOString().split('T')[0]}.json`;
                  a.click();
                }}
              >
                <Save size={18} /> Exportar Backup (JSON)
              </button>
              
              <label className="btn btn-ghost" style={{ cursor: 'pointer' }}>
                <Plus size={18} /> Importar Backup
                <input type="file" accept=".json" style={{ display: 'none' }} onChange={handleImport} disabled={loading} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {showResetModal && (
        <div className="modal-overlay" onClick={() => setShowResetModal(false)}>
          <div className="modal animate-slide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2 style={{ color: 'var(--red)' }}>Tem certeza?</h2>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowResetModal(false)}><X size={20} /></button>
            </div>
            <p style={{ marginBottom: '20px' }}>Para confirmar, digite <strong>RESET</strong> no campo abaixo:</p>
            <input type="text" className="form-input" value={resetConfirm} onChange={(e) => setResetConfirm(e.target.value)} placeholder="Digite RESET" style={{ marginBottom: '20px', textAlign: 'center', fontWeight: 800, fontSize: '1.1rem' }} />
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancelar</button>
              <button className="btn btn-danger" onClick={handleReset} disabled={resetConfirm !== 'RESET' || loading}>
                {loading ? <Loader2 size={18} className="animate-spin" /> : 'Apagar Tudo Permanentemente'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
