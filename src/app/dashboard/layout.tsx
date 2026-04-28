'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import {
  LayoutDashboard, ArrowLeftRight, Tag, RotateCcw,
  CreditCard, Target, Settings, LogOut, TrendingUp, Menu
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/transactions', label: 'Transações', icon: ArrowLeftRight },
  { href: '/dashboard/categories', label: 'Categorias', icon: Tag },
  { href: '/dashboard/recurring', label: 'Recorrentes', icon: RotateCcw },
  { href: '/dashboard/cards', label: 'Cartões', icon: CreditCard },
  { href: '/dashboard/goals', label: 'Metas', icon: Target },
  { href: '/dashboard/insights', label: 'Insights', icon: TrendingUp },
];

function DashboardContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const userName = session?.user?.name || 'Usuário';
  const userEmail = session?.user?.email || '';
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-layout">
      {/* Sidebar Desktop */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>💰 FinanPro</h2>
          <span>Gestão Inteligente</span>
        </div>
        <nav className="sidebar-nav">
          <div className="nav-section">Menu</div>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`}>
              <item.icon size={20} />
              {item.label}
            </Link>
          ))}
          <div className="nav-section">Configurações</div>
          <Link href="/dashboard/settings" className={`nav-item ${pathname === '/dashboard/settings' ? 'active' : ''}`}>
            <Settings size={20} /> Configurações
          </Link>
        </nav>
        <div className="sidebar-footer">
          <div className="user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <div className="user-name">{userName}</div>
              <div className="user-email">{userEmail}</div>
            </div>
          </div>
          <button onClick={() => signOut({ callbackUrl: '/login' })} className="nav-item" style={{ marginTop: '8px', color: 'var(--red)' }}>
            <LogOut size={20} /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="mobile-header">
        <h2 style={{ fontSize: '1.1rem', background: 'linear-gradient(135deg, var(--accent), #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          💰 FinanPro
        </h2>
        <button className="btn btn-ghost btn-icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          <Menu size={22} />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="modal-overlay" onClick={() => setMobileMenuOpen(false)}>
          <aside className="sidebar" style={{ display: 'flex', position: 'fixed', left: 0, top: 0 }} onClick={(e) => e.stopPropagation()}>
            <div className="sidebar-logo">
              <h2>💰 FinanPro</h2>
            </div>
            <nav className="sidebar-nav">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className={`nav-item ${pathname === item.href ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                  <item.icon size={20} />
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="sidebar-footer">
              <button onClick={() => signOut({ callbackUrl: '/login' })} className="nav-item" style={{ color: 'var(--red)' }}>
                <LogOut size={20} /> Sair
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main */}
      <main className="main-content">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {navItems.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}>
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <DashboardContent>{children}</DashboardContent>
    </SessionProvider>
  );
}
