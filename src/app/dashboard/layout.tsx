'use client';

import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { SessionProvider } from 'next-auth/react';
import {
  LayoutDashboard, ArrowLeftRight, Tag, RotateCcw,
  CreditCard, Target, Settings, LogOut, TrendingUp, Menu, Bell, X as CloseIcon, Info, AlertTriangle
} from 'lucide-react';
import { useState, useEffect } from 'react';
import WelcomeTour from '@/components/WelcomeTour';

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
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch('/api/notifications');
        if (res.ok) setNotifications(await res.json());
      } catch (err) { console.error(err); }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // Atualizar a cada minuto
    return () => clearInterval(interval);
  }, []);

  const userName = session?.user?.name || 'Usuário';
  const userEmail = session?.user?.email || '';
  const initials = userName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="app-layout">
      {/* Sidebar Desktop */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <h2>💰 FinanPro</h2>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
            <span style={{ fontSize: '0.75rem', opacity: 0.7 }}>Gestão Inteligente</span>
            <div style={{ position: 'relative' }}>
              <button 
                className={`btn-icon-sm ${notifications.length > 0 ? 'pulse-orange' : ''}`} 
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '8px', padding: '6px', border: 'none', color: 'white', cursor: 'pointer' }}
              >
                <Bell size={18} />
                {notifications.length > 0 && <span className="notification-badge">{notifications.length}</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Notifications Dropdown */}
        {showNotifications && (
          <div className="notifications-panel animate-slide">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <h4 style={{ margin: 0 }}>Alertas</h4>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setShowNotifications(false)}><CloseIcon size={16} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {notifications.length === 0 ? (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px 0' }}>Tudo em dia!</p>
              ) : (
                notifications.map(notif => (
                  <div key={notif.id} className={`notif-item severity-${notif.severity.toLowerCase()}`}>
                    {notif.severity === 'HIGH' ? <AlertTriangle size={14} /> : <Info size={14} />}
                    <div>
                      <div style={{ fontWeight: 600 }}>{notif.title}</div>
                      <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>{notif.message}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
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

      <style jsx>{`
        .notification-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          background: var(--red);
          color: white;
          font-size: 0.65rem;
          font-weight: 800;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #1e1e2e;
        }
        .notifications-panel {
          position: absolute;
          top: 80px;
          left: 20px;
          right: 20px;
          background: #252538;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.5);
          z-index: 100;
          border: 1px solid rgba(255,255,255,0.1);
        }
        .notif-item {
          display: flex;
          gap: 10px;
          padding: 10px;
          border-radius: 8px;
          font-size: 0.85rem;
          background: rgba(255,255,255,0.03);
        }
        .severity-high { border-left: 3px solid var(--red); color: #ff8080; }
        .severity-medium { border-left: 3px solid var(--yellow); color: #ffd980; }
        .severity-info { border-left: 3px solid var(--blue); color: #80b3ff; }
        
        .pulse-orange {
          animation: pulse-orange 2s infinite;
        }
        @keyframes pulse-orange {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
      `}</style>

      {/* Mobile Bottom Nav */}
      <nav className="mobile-nav">
        {navItems.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className={`mobile-nav-item ${pathname === item.href ? 'active' : ''}`}>
            <item.icon size={20} />
            {item.label}
          </Link>
        ))}
      </nav>
      <WelcomeTour />
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
