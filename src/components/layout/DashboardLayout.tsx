import { useState, type ReactNode } from 'react';
import { Bell, LogOut, Menu, Search, X } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { Logo } from '../brand/Logo';
import { cx } from '../ui/Primitives';

interface NavItem { to: string; label: string; icon: LucideIcon; end?: boolean }
interface DashboardLayoutProps { admin?: boolean; nav: NavItem[]; children?: ReactNode }

export function DashboardLayout({ admin = false, nav }: DashboardLayoutProps) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const leave = () => { logout(); navigate('/'); };
  // Longest match wins so that nested routes keep their parent section's label.
  const current = [...nav].sort((a, b) => b.to.length - a.to.length).find(({ to }) => pathname === to || pathname.startsWith(`${to}/`));

  return (
    <div className={cx('dashboard-shell', admin && 'admin-shell')}>
      <button className={cx('sidebar-scrim', open && 'is-open')} aria-label="Закрыть меню" onClick={() => setOpen(false)} />
      <aside className={cx('sidebar', open && 'is-open')} aria-label={admin ? 'Административная навигация' : 'Навигация пользователя'}>
        <div>
          <div className="sidebar-head"><Logo admin={admin} /><button className="icon-button sidebar-close" onClick={() => setOpen(false)} aria-label="Закрыть меню"><X /></button></div>
          <div className="system-pill"><span className="status-dot" /> {admin ? 'DAG_SYS // ONLINE' : '42 РАЙОНА // ONLINE'}</div>
          <nav className="side-nav">
            {nav.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end} onClick={() => setOpen(false)} className={({ isActive }) => cx('side-link', isActive && 'active')}>
                <Icon size={19} /><span>{label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="sidebar-user">
          <span className="avatar avatar-small">{user?.fullName.split(' ').map((part) => part[0]).join('').slice(0, 2) ?? 'EC'}</span>
          <span className="sidebar-user-copy"><strong>{user?.fullName ?? 'EagleCode'}</strong><small>{admin ? 'Администратор' : 'Участник платформы'}</small></span>
          <button className="icon-button" onClick={leave} aria-label="Выйти"><LogOut size={18} /></button>
        </div>
      </aside>
      <div className="dashboard-stage">
        <header className="dashboard-topbar">
          <button className="icon-button mobile-menu" onClick={() => setOpen(true)} aria-label="Открыть меню"><Menu /></button>
          <div className="breadcrumb"><strong>EagleCode</strong><span>//</span><span>{current?.label ?? (admin ? 'Центр управления' : 'Спортивный профиль')}</span></div>
          <div className="topbar-actions">
            <label className="top-search"><Search size={17} /><span className="sr-only">Поиск</span><input aria-label="Поиск" placeholder="Поиск по платформе…" /></label>
            <button className="icon-button" aria-label="Уведомления"><Bell size={19} /><span className="notification-dot" /></button>
            <span className="avatar avatar-small">{user?.fullName.slice(0, 1) ?? 'E'}</span>
          </div>
        </header>
        <main className="dashboard-main"><Outlet /></main>
      </div>
    </div>
  );
}

