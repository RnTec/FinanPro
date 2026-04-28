'use client';

import { useEffect, useState, useCallback } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler } from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';
import { TrendingUp, TrendingDown, Wallet, PiggyBank, ArrowUpRight, ArrowDownRight, Clock, AlertTriangle, Plus } from 'lucide-react';
import { formatCurrency, formatDate, getMonthNameShort, getDaysUntil } from '@/lib/utils';
import Link from 'next/link';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler);

interface DashboardData {
  summary: {
    totalIncome: number; totalExpense: number; balance: number;
    prevIncome: number; prevExpense: number;
    fixedCosts: number; variableCosts: number; taxCosts: number;
    savingsRate: number;
  };
  expensesByCategory: { name: string; color: string; total: number }[];
  monthlyData: { month: number; year: number; income: number; expense: number }[];
  recentTransactions: Array<{
    id: string; amount: number; type: string; description: string; date: string;
    category: { name: string; color: string; icon: string } | null;
  }>;
  upcomingBills: Array<{ id: string; name: string; expectedAmount: number; nextDueDate: string }>;
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard');
      if (res.ok) setData(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return (
    <div className="page-content">
      <div className="stats-grid">{[1,2,3,4].map(i => <div key={i} className="card skeleton" style={{ height: '140px' }} />)}</div>
      <div className="charts-grid">{[1,2].map(i => <div key={i} className="card skeleton" style={{ height: '320px' }} />)}</div>
    </div>
  );

  if (!data) return <div className="page-content"><p>Erro ao carregar dados</p></div>;

  const { summary } = data;
  const incomeChange = summary.prevIncome > 0 ? ((summary.totalIncome - summary.prevIncome) / summary.prevIncome * 100) : 0;
  const expenseChange = summary.prevExpense > 0 ? ((summary.totalExpense - summary.prevExpense) / summary.prevExpense * 100) : 0;

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
  };

  const doughnutData = {
    labels: data.expensesByCategory.map(c => c.name),
    datasets: [{
      data: data.expensesByCategory.map(c => c.total),
      backgroundColor: data.expensesByCategory.map(c => c.color),
      borderWidth: 0,
      cutout: '72%',
    }],
  };

  const barData = {
    labels: data.monthlyData.map(m => getMonthNameShort(m.month)),
    datasets: [
      { label: 'Receitas', data: data.monthlyData.map(m => m.income), backgroundColor: 'rgba(16,185,129,0.7)', borderRadius: 6 },
      { label: 'Despesas', data: data.monthlyData.map(m => m.expense), backgroundColor: 'rgba(239,68,68,0.7)', borderRadius: 6 },
    ],
  };

  const lineData = {
    labels: data.monthlyData.map(m => getMonthNameShort(m.month)),
    datasets: [
      {
        label: 'Saldo Mensal',
        data: data.monthlyData.map(m => m.income - m.expense),
        borderColor: '#6366f1',
        backgroundColor: 'rgba(99,102,241,0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#6366f1',
      },
      {
        label: 'Saldo Acumulado',
        data: data.monthlyData.reduce((acc: number[], curr, i) => {
          const monthlyBalance = curr.income - curr.expense;
          const prevAccumulated = i > 0 ? acc[i-1] : (data.summary.balance - data.monthlyData.slice(i).reduce((s, m) => s + (m.income - m.expense), 0));
          acc.push(prevAccumulated + monthlyBalance);
          return acc;
        }, []),
        borderColor: 'var(--green)',
        borderDash: [5, 5],
        tension: 0.4,
        pointRadius: 0,
        fill: false,
      }
    ],
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Visão geral das suas finanças</p>
        </div>
        <Link href="/dashboard/transactions?new=true" className="btn btn-primary">
          <Plus size={18} /> Nova Transação
        </Link>
      </div>

      <div className="page-content animate-fade">
        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'var(--green-bg)' }}>
              <TrendingUp size={22} color="var(--green)" />
            </div>
            <div className="stat-label">Receitas</div>
            <div className="stat-value" style={{ color: 'var(--green)' }}>{formatCurrency(summary.totalIncome)}</div>
            <span className={`stat-change ${incomeChange >= 0 ? 'amount-income' : 'amount-expense'}`}>
              {incomeChange >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {Math.abs(incomeChange).toFixed(1)}% vs mês anterior
            </span>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'var(--red-bg)' }}>
              <TrendingDown size={22} color="var(--red)" />
            </div>
            <div className="stat-label">Despesas</div>
            <div className="stat-value" style={{ color: 'var(--red)' }}>{formatCurrency(summary.totalExpense)}</div>
            <span className={`stat-change ${expenseChange <= 0 ? 'amount-income' : 'amount-expense'}`}>
              {expenseChange <= 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
              {Math.abs(expenseChange).toFixed(1)}% vs mês anterior
            </span>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'var(--blue-bg)' }}>
              <Wallet size={22} color="var(--blue)" />
            </div>
            <div className="stat-label">Saldo</div>
            <div className="stat-value" style={{ color: summary.balance >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {formatCurrency(summary.balance)}
            </div>
            <span className="stat-change" style={{ color: 'var(--text-muted)' }}>
              Receitas - Despesas
            </span>
          </div>

          <div className="card stat-card">
            <div className="stat-icon" style={{ background: 'rgba(99,102,241,0.12)' }}>
              <PiggyBank size={22} color="var(--accent)" />
            </div>
            <div className="stat-label">Taxa de Economia</div>
            <div className="stat-value" style={{ color: 'var(--accent)' }}>{summary.savingsRate.toFixed(1)}%</div>
            <span className="stat-change" style={{ color: 'var(--text-muted)' }}>
              do total de receitas
            </span>
          </div>
        </div>

        {/* Charts */}
        <div className="charts-grid">
          <div className="card chart-card">
            <div className="chart-header">
              <h3>Despesas por Categoria</h3>
            </div>
            <div style={{ position: 'relative', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {data.expensesByCategory.length > 0 ? (
                <Doughnut data={doughnutData} options={{ ...chartOptions, plugins: { ...chartOptions.plugins, tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${formatCurrency(ctx.parsed)}` } } } }} />
              ) : (
                <p style={{ color: 'var(--text-muted)' }}>Sem dados</p>
              )}
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '16px' }}>
              {data.expensesByCategory.slice(0, 6).map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  <span className="category-dot" style={{ backgroundColor: cat.color }} />
                  {cat.name}
                </div>
              ))}
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-header">
              <h3>Receitas vs Despesas</h3>
              <span className="badge badge-blue">6 meses</span>
            </div>
            <div style={{ height: '260px' }}>
              <Bar data={barData} options={{
                ...chartOptions,
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#64748b' } },
                  y: { grid: { color: 'rgba(99,102,241,0.08)' }, ticks: { color: '#64748b', callback: (v) => `R$${(Number(v)/1000).toFixed(0)}k` } },
                },
              }} />
            </div>
          </div>
        </div>

        {/* Balance Trend + Recent + Bills */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="card">
            <div className="chart-header">
              <h3>Evolução do Saldo</h3>
            </div>
            <div style={{ height: '200px' }}>
              <Line data={lineData} options={{
                ...chartOptions,
                scales: {
                  x: { grid: { display: false }, ticks: { color: '#64748b' } },
                  y: { grid: { color: 'rgba(99,102,241,0.08)' }, ticks: { color: '#64748b', callback: (v) => formatCurrency(Number(v)) } },
                },
              }} />
            </div>
          </div>

          <div className="card">
            <div className="chart-header">
              <h3>Últimas Transações</h3>
              <Link href="/dashboard/transactions" className="btn btn-ghost btn-sm">Ver todas</Link>
            </div>
            <div className="transaction-list">
              {data.recentTransactions.slice(0, 5).map((t) => (
                <div key={t.id} className="transaction-item">
                  <div className="transaction-icon" style={{ backgroundColor: t.category?.color ? `${t.category.color}20` : 'var(--bg-input)' }}>
                    <span style={{ fontSize: '0.85rem' }}>{t.type === 'INCOME' ? '📈' : '📉'}</span>
                  </div>
                  <div className="transaction-info">
                    <div className="transaction-desc">{t.description}</div>
                    <div className="transaction-meta">
                      <span>{t.category?.name || 'Sem categoria'}</span>
                      <span>•</span>
                      <span>{formatDate(t.date)}</span>
                    </div>
                  </div>
                  <div className={`transaction-amount ${t.type === 'INCOME' ? 'amount-income' : 'amount-expense'}`}>
                    {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Upcoming Bills */}
        {data.upcomingBills.length > 0 && (
          <div className="card" style={{ marginTop: '20px' }}>
            <div className="chart-header">
              <h3>⏰ Contas Próximas</h3>
              <Link href="/dashboard/recurring" className="btn btn-ghost btn-sm">Ver todas</Link>
            </div>
            {data.upcomingBills.map((bill) => {
              const days = getDaysUntil(new Date(bill.nextDueDate));
              return (
                <div key={bill.id} className={`alert-card ${days <= 3 ? 'alert-danger' : days <= 7 ? 'alert-warning' : 'alert-info'}`}>
                  {days <= 3 ? <AlertTriangle size={18} /> : <Clock size={18} />}
                  <div style={{ flex: 1 }}>
                    <strong>{bill.name}</strong>
                    <span style={{ marginLeft: '8px', fontSize: '0.85rem', opacity: 0.8 }}>
                      {formatCurrency(bill.expectedAmount)}
                    </span>
                  </div>
                  <span className={`badge ${days <= 3 ? 'badge-red' : days <= 7 ? 'badge-yellow' : 'badge-blue'}`}>
                    {days <= 0 ? 'Vencida!' : `${days} dias`}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
