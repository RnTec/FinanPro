'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Wallet, PiggyBank,
  ArrowUpRight, ArrowDownRight, Clock, AlertTriangle,
  Plus, Search, CreditCard, ChevronDown, Calendar, RefreshCw
} from 'lucide-react';
import { formatCurrency, formatDateShort, getMonthNameShort } from '@/lib/utils';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

// Registrar os elementos do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    balance: number;
    prevIncome: number;
    prevExpense: number;
    fixedCosts: number;
    variableCosts: number;
    taxCosts: number;
    savingsRate: number;
  };
  expensesByCategory: Array<{
    name: string;
    color: string;
    total: number;
  }>;
  monthlyData: Array<{
    month: number;
    year: number;
    income: number;
    expense: number;
  }>;
  recentTransactions: Array<{
    id: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    description: string;
    date: string;
    category?: {
      name: string;
      color: string;
    };
  }>;
  upcomingBills: Array<{
    id: string;
    name: string;
    expectedAmount: number;
    nextDueDate: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedCardFilter, setSelectedCardFilter] = useState('Todos');

  // Nome do usuário logado ou default
  const userName = session?.user?.name || 'Usuário FinanPro';

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [dashRes, cardsRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/cards')
      ]);

      if (!dashRes.ok) throw new Error('Falha ao carregar dados do dashboard');
      
      const dashData = await dashRes.json();
      setData(dashData);

      if (cardsRes.ok) {
        const cardsData = await cardsRes.json();
        setCards(cardsData);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro de conexão ao carregar o dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="page-content animate-fade">
        {/* Cabeçalho Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div>
            <div className="skeleton" style={{ width: '200px', height: '36px', marginBottom: '8px' }}></div>
            <div className="skeleton" style={{ width: '320px', height: '18px' }}></div>
          </div>
          <div className="skeleton" style={{ width: '280px', height: '42px', borderRadius: '100px' }}></div>
        </div>

        {/* Quick Stats Skeleton */}
        <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div className="skeleton" style={{ width: '180px', height: '40px', borderRadius: '100px' }}></div>
          <div className="skeleton" style={{ width: '180px', height: '40px', borderRadius: '100px' }}></div>
          <div className="skeleton" style={{ width: '200px', height: '40px', borderRadius: '100px' }}></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="stats-grid" style={{ marginBottom: '24px' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '140px', borderRadius: '16px' }}></div>
          ))}
        </div>

        {/* Charts Grid Skeleton */}
        <div className="charts-grid">
          <div className="skeleton" style={{ height: '380px', borderRadius: '16px' }}></div>
          <div className="skeleton" style={{ height: '380px', borderRadius: '16px' }}></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="page-content animate-fade" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ background: 'var(--red-bg)', border: '1px solid rgba(239, 68, 68, 0.15)', borderRadius: '16px', padding: '32px', textAlign: 'center', maxWidth: '480px' }}>
          <AlertTriangle size={48} style={{ color: 'var(--red)', marginBottom: '16px' }} />
          <h3 style={{ marginBottom: '8px', color: 'var(--text-primary)' }}>Falha ao Carregar Dashboard</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>{error || 'Não foi possível se comunicar com o banco de dados.'}</p>
          <button className="btn btn-primary" onClick={fetchDashboardData} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <RefreshCw size={16} /> Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  const { summary, expensesByCategory, monthlyData, recentTransactions, upcomingBills } = data;

  // Filtragem de transações com base no termo de pesquisa
  const filteredTransactions = recentTransactions.filter(t =>
    t.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Configuração do Gráfico de Evolução (Line Chart)
  // Replicando o design com 2 curvas tensionadas (Ouro Dourado para Despesas, Índigo para Receitas)
  const lineChartData = {
    labels: monthlyData.map(d => getMonthNameShort(d.month)),
    datasets: [
      {
        label: 'Receitas',
        data: monthlyData.map(d => d.income),
        borderColor: '#5b73e8', // Índigo/Blue
        backgroundColor: 'rgba(91, 115, 232, 0.04)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: '#5b73e8',
        pointBorderColor: '#090a0f',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      },
      {
        label: 'Despesas',
        data: monthlyData.map(d => d.expense),
        borderColor: '#f6c445', // Gold Dourado
        backgroundColor: 'rgba(246, 196, 69, 0.04)',
        tension: 0.4,
        fill: true,
        borderWidth: 3,
        pointBackgroundColor: '#f6c445',
        pointBorderColor: '#090a0f',
        pointBorderWidth: 2,
        pointHoverRadius: 7,
      }
    ]
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }, // Legend customizada em HTML como OnePay
      tooltip: {
        backgroundColor: '#171821',
        titleFont: { family: 'Outfit', size: 13, weight: 600 as const },
        bodyFont: { family: 'Outfit', size: 12 },
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) {
              label += formatCurrency(context.parsed.y);
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#8f94a8', font: { family: 'Outfit', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.02)' },
        ticks: {
          color: '#8f94a8',
          font: { family: 'Outfit', size: 11 },
          callback: function(value: any) {
            if (value >= 1000) return `R$ ${value / 1000}k`;
            return `R$ ${value}`;
          }
        },
        border: { dash: [5, 5] as any }
      }
    }
  };

  // Configuração do Gráfico Doughnut (Despesas por Categoria)
  const categoryChartColors = expensesByCategory.map(c => c.color || '#6366f1');
  const doughnutData = {
    labels: expensesByCategory.map(c => c.name),
    datasets: [
      {
        data: expensesByCategory.map(c => c.total),
        backgroundColor: categoryChartColors,
        borderWidth: 2,
        borderColor: '#171821',
        hoverOffset: 4
      }
    ]
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#171821',
        bodyFont: { family: 'Outfit', size: 12 },
        borderColor: 'rgba(255,255,255,0.06)',
        borderWidth: 1,
        callbacks: {
          label: function(context: any) {
            const val = context.raw;
            return ` ${context.label}: ${formatCurrency(val)}`;
          }
        }
      }
    },
    cutout: '72%'
  };

  // Variações percentuais de métricas principais
  const incomeChange = summary.prevIncome > 0 ? ((summary.totalIncome - summary.prevIncome) / summary.prevIncome * 100) : 0;
  const expenseChange = summary.prevExpense > 0 ? ((summary.totalExpense - summary.prevExpense) / summary.prevExpense * 100) : 0;

  return (
    <div className="page-content animate-fade">
      
      {/* 1. Header do Dashboard com Barra de Pesquisa Estilo OnePay */}
      <header className="page-header" style={{ background: 'transparent', padding: '0 0 20px', borderBottom: 'none' }}>
        <div>
          <h1 style={{ fontWeight: 800 }}>Dashboard</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '2px' }}>
            Gerencie seus ativos e fluxo de caixa de forma inteligente
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%', maxWidth: 'fit-content' }}>
          {/* Barra de Pesquisa Estilo Cápsula */}
          <div className="search-bar-wrapper">
            <Search size={16} className="search-bar-icon" />
            <input
              type="text"
              className="search-bar-input"
              placeholder="Pesquisar transações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Botão Upgrade Premium */}
          <button 
            className="btn btn-primary" 
            onClick={() => setShowUpgradeModal(true)} 
            style={{ borderRadius: '100px', fontWeight: 700, padding: '10px 24px', fontSize: '0.8rem' }}
          >
            ⭐ Upgrade
          </button>

          {/* Botão Nova Transação */}
          <Link href="/dashboard/transactions" className="btn btn-secondary" style={{ borderRadius: '100px', fontWeight: 600, fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={16} /> Nova Transação
          </Link>
        </div>
      </header>

      {/* 2. Mini Métricas Rápidas no Topo (Header Quick Stats) */}
      <div className="header-quick-stats" style={{ marginBottom: '8px' }}>
        <div className="quick-stat-item">
          <div className="quick-stat-icon">💰</div>
          <div>
            <span className="quick-stat-label">Totais Semanais</span>
            <span className="quick-stat-val">R$ 989,80</span>
          </div>
          <span className="quick-stat-change badge-green">+12%</span>
        </div>
        <div className="quick-stat-item">
          <div className="quick-stat-icon" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--red)' }}>💳</div>
          <div>
            <span className="quick-stat-label">Totais Mensais</span>
            <span className="quick-stat-val">R$ 4.245,29</span>
          </div>
          <span className="quick-stat-change badge-red">-3%</span>
        </div>
        <div className="quick-stat-item">
          <div className="quick-stat-icon" style={{ background: 'rgba(91,115,232,0.1)', color: 'var(--blue)' }}>📈</div>
          <div>
            <span className="quick-stat-label">Totais Anuais</span>
            <span className="quick-stat-val">R$ 25.289,29</span>
          </div>
          <span className="quick-stat-change badge-yellow" style={{ background: 'var(--accent-glow)', color: 'var(--accent)' }}>14%</span>
        </div>
      </div>

      {/* 3. Grid de Cartões de Métricas Principais */}
      <section className="stats-grid">
        {/* Receitas */}
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="stat-label">Receita do Mês</span>
              <h2 className="stat-value" style={{ color: 'var(--green)' }}>{formatCurrency(summary.totalIncome)}</h2>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: 'var(--green)' }}>
              <ArrowUpRight size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`badge ${incomeChange >= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.7rem' }}>
              {incomeChange >= 0 ? '+' : ''}{incomeChange.toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>em relação ao mês passado</span>
          </div>
        </div>

        {/* Despesas */}
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="stat-label">Despesa do Mês</span>
              <h2 className="stat-value" style={{ color: 'var(--red)' }}>{formatCurrency(summary.totalExpense)}</h2>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--red)' }}>
              <ArrowDownRight size={22} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className={`badge ${expenseChange <= 0 ? 'badge-green' : 'badge-red'}`} style={{ fontSize: '0.7rem' }}>
              {expenseChange >= 0 ? '+' : ''}{expenseChange.toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>em relação ao mês passado</span>
          </div>
        </div>

        {/* Saldo Líquido */}
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="stat-label">Saldo do Mês</span>
              <h2 className="stat-value" style={{ color: summary.balance >= 0 ? 'var(--text-primary)' : 'var(--red)' }}>
                {formatCurrency(summary.balance)}
              </h2>
            </div>
            <div className="stat-icon" style={{ background: 'rgba(255, 255, 255, 0.04)', color: 'var(--text-secondary)' }}>
              <Wallet size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div className="badge badge-blue" style={{ fontSize: '0.7rem' }}>
              {summary.balance >= 0 ? 'Positivo' : 'Negativo'}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>fluxo de caixa atual</span>
          </div>
        </div>

        {/* Taxa de Economia */}
        <div className="card stat-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <span className="stat-label">Taxa de Economia</span>
              <h2 className="stat-value" style={{ color: 'var(--accent)' }}>{summary.savingsRate.toFixed(1)}%</h2>
            </div>
            <div className="stat-icon" style={{ background: 'var(--yellow-bg)', color: 'var(--accent)' }}>
              <PiggyBank size={20} />
            </div>
          </div>
          <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="badge badge-yellow" style={{ fontSize: '0.7rem' }}>
              {summary.savingsRate >= 20 ? 'Excelente' : summary.savingsRate >= 10 ? 'Bom' : 'Abaixo do recomendado'}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>meta mínima: 20%</span>
          </div>
        </div>
      </section>

      {/* 4. Grid do Gráfico de Fluxo de Caixa e Widget "Meus Cartões" */}
      <section className="charts-grid">
        {/* Gráfico de Evolução de Receita / Balanço */}
        <div className="card chart-card">
          <header className="chart-header">
            <div>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Faturamento & Fluxo
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 800 }}>{formatCurrency(summary.totalIncome)}</h2>
                <span className="badge badge-blue" style={{ fontSize: '0.7rem', padding: '2px 8px', fontWeight: 700 }}>
                  <TrendingUp size={12} style={{ marginRight: '3px' }} /> +33%
                </span>
              </div>
            </div>

            {/* Dropdown de Contas/Cartões como OnePay */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', marginRight: '8px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span className="category-dot" style={{ background: '#5b73e8' }}></span> Receitas
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                  <span className="category-dot" style={{ background: '#f6c445' }}></span> Despesas
                </span>
              </div>

              <div style={{ position: 'relative' }}>
                <button className="btn btn-secondary btn-sm" style={{ padding: '6px 14px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.02)' }}>
                  Mastercard <ChevronDown size={14} style={{ opacity: 0.6 }} />
                </button>
              </div>
            </div>
          </header>

          <div className="chart-container-wrapper" style={{ minHeight: '260px' }}>
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>

        {/* Seção "Meus Cartões" com visual ultra premium fotorrealista */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Meus Cartões</h3>
            <Link href="/dashboard/cards" className="btn btn-ghost btn-icon btn-sm" style={{ borderRadius: '50%', background: 'rgba(255,255,255,0.03)', color: 'white', width: '32px', height: '32px' }}>
              <Plus size={16} />
            </Link>
          </div>

          <div className="credit-cards-container" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Cartão 1: Gold Premium (Estilo Olga Bals na foto) */}
            <div className="credit-card-item card-gradient-gold">
              <div className="card-header-brand">
                <span className="card-tier" style={{ fontWeight: 800 }}>Premium</span>
                <div className="card-chip"></div>
              </div>
              <div className="card-number">•••• •••• •••• 1777</div>
              <div className="card-footer-info">
                <div className="card-holder">
                  <span className="card-holder-label">Titular do Cartão</span>
                  <span className="card-holder-name">{userName}</span>
                </div>
                <div className="card-expiry">
                  <span className="card-holder-label" style={{ display: 'block' }}>Vence em</span>
                  <span className="card-expiry-val">07/28</span>
                </div>
              </div>
            </div>

            {/* Cartão 2: Indigo MasterCard */}
            <div className="credit-card-item card-gradient-blue">
              <div className="card-header-brand">
                <span className="card-tier" style={{ fontWeight: 800, letterSpacing: '0.05em' }}>Mastercard.</span>
                <div className="card-chip" style={{ background: 'linear-gradient(135deg, #e0a96d 0%, #ad7a42 100%)' }}></div>
              </div>
              <div className="card-number" style={{ color: 'white' }}>•••• •••• •••• 5644</div>
              <div className="card-footer-info">
                <div className="card-holder">
                  <span className="card-holder-label" style={{ opacity: 0.75 }}>Titular do Cartão</span>
                  <span className="card-holder-name" style={{ color: 'white' }}>{userName}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
                  <div className="card-expiry" style={{ textAlign: 'right' }}>
                    <span className="card-holder-label" style={{ display: 'block', opacity: 0.75 }}>Vence em</span>
                    <span className="card-expiry-val" style={{ color: 'white' }}>12/29</span>
                  </div>
                  {/* MasterCard Symbol Emblem (overlapping red and orange circles) */}
                  <div style={{ display: 'flex', width: '36px', height: '24px', position: 'relative' }}>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#eb001b', opacity: 0.9, position: 'absolute', left: 0 }}></div>
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#f79e1b', opacity: 0.9, position: 'absolute', right: 0 }}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Grid de Transações Recentes e Gráficos de Categorias / Alertas de Contas */}
      <section className="charts-grid">
        {/* Lista de Transações Recentes inspirada na foto */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem' }}>Transações Recentes</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <select 
                className="form-select btn-sm" 
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: '100px', color: 'var(--text-secondary)', padding: '4px 28px 4px 12px', fontSize: '0.78rem' }}
                value={selectedCardFilter}
                onChange={(e) => setSelectedCardFilter(e.target.value)}
              >
                <option value="Todos">Esta semana</option>
                <option value="Mes">Este mês</option>
              </select>
              <Link href="/dashboard/transactions" style={{ fontSize: '0.78rem', fontWeight: 600 }}>
                Ver todas
              </Link>
            </div>
          </div>

          <div className="transaction-list" style={{ flex: 1 }}>
            {filteredTransactions.length === 0 ? (
              <div className="empty-state">
                <p>Nenhuma transação encontrada.</p>
              </div>
            ) : (
              filteredTransactions.map((tx) => {
                const initials = tx.description.slice(0, 2).toUpperCase();
                const isIncome = tx.type === 'INCOME';
                const txColor = tx.category?.color || '#5b73e8';

                return (
                  <div key={tx.id} className="transaction-item">
                    {/* Iniciais estilizadas com avatar arredondado e cor suave correspondente */}
                    <div 
                      className="transaction-icon" 
                      style={{ 
                        background: isIncome ? 'var(--green-bg)' : 'var(--red-bg)', 
                        color: isIncome ? 'var(--green)' : 'var(--red)',
                        fontWeight: 700,
                        fontSize: '0.8rem'
                      }}
                    >
                      {initials}
                    </div>

                    <div className="transaction-info">
                      <div className="transaction-desc">{tx.description}</div>
                      <div className="transaction-meta">
                        {/* Categoria Pill suave */}
                        <span 
                          className="badge" 
                          style={{ 
                            background: `rgba(${parseInt(txColor.slice(1,3), 16)}, ${parseInt(txColor.slice(3,5), 16)}, ${parseInt(txColor.slice(5,7), 16)}, 0.1)`, 
                            color: txColor,
                            fontSize: '0.68rem',
                            padding: '1px 8px',
                            borderRadius: '100px'
                          }}
                        >
                          {tx.category?.name || 'Sem categoria'}
                        </span>
                        <span>•</span>
                        <span>{formatDateShort(tx.date)}</span>
                      </div>
                    </div>

                    <div className={`transaction-amount ${isIncome ? 'amount-income' : 'amount-expense'}`} style={{ fontSize: '0.88rem' }}>
                      {isIncome ? '+' : '-'}&nbsp;{formatCurrency(tx.amount)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Despesas por Categoria (Doughnut) e Alertas de Contas Próximas */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '16px' }}>Despesas por Categoria</h3>
            {expensesByCategory.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <p style={{ fontSize: '0.82rem' }}>Sem despesas este mês.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', minHeight: '130px' }}>
                <div className="chart-container-wrapper" style={{ width: '130px', height: '130px', flexShrink: 0 }}>
                  <Doughnut data={doughnutData} options={doughnutOptions} />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '140px', overflowY: 'auto' }}>
                  {expensesByCategory.slice(0, 4).map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
                        <span className="category-dot" style={{ background: c.color }}></span> {c.name}
                      </span>
                      <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', flex: 1 }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={16} style={{ color: 'var(--yellow)' }} /> Alertas de Contas
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {upcomingBills.length === 0 ? (
                <div className="alert-card alert-info" style={{ margin: 0, padding: '12px' }}>
                  <span style={{ fontSize: '0.8rem' }}>Tudo pago! Nenhuma conta a vencer nos próximos dias.</span>
                </div>
              ) : (
                upcomingBills.slice(0, 3).map((bill) => {
                  const daysLeft = Math.ceil((new Date(bill.nextDueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isLate = daysLeft < 0;
                  
                  return (
                    <div 
                      key={bill.id} 
                      className={`alert-card ${isLate ? 'alert-danger' : daysLeft <= 2 ? 'alert-warning' : 'alert-info'}`}
                      style={{ margin: 0, padding: '10px 12px', justifyContent: 'space-between', alignItems: 'center' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                        <AlertTriangle size={14} style={{ flexShrink: 0 }} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{bill.name}</div>
                          <div style={{ fontSize: '0.7rem', opacity: 0.8 }}>
                            {isLate ? 'Atrasada!' : `Vence em ${daysLeft} dia${daysLeft === 1 ? '' : 's'}`}
                          </div>
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{formatCurrency(bill.expectedAmount)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modal Upgrade Mockup Premium */}
      {showUpgradeModal && (
        <div className="modal-overlay animate-fade" onClick={() => setShowUpgradeModal(false)}>
          <div className="modal animate-slide" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👑</div>
            <h2 style={{ fontWeight: 800, marginBottom: '8px' }}>Você já é Premium!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.6', marginBottom: '24px' }}>
              Parabéns! Sua conta **{userName}** possui o plano anual ilimitado ativado. Você tem acesso a todas as ferramentas financeiras inteligentes, IA de gastos, relatórios automáticos e exportação.
            </p>
            <button className="btn btn-primary" onClick={() => setShowUpgradeModal(false)} style={{ borderRadius: '100px', width: '100%' }}>
              Excelente!
            </button>
          </div>
        </div>
      )}
      
    </div>
  );
}
