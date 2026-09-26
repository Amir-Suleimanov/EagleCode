import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '../brand/Logo';

export function PublicLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="public-shell">
      <header className="public-header">
        <Logo />
        <button className="icon-button public-menu" onClick={() => setOpen(!open)} aria-label={open ? 'Закрыть меню' : 'Открыть меню'}>{open ? <X /> : <Menu />}</button>
        <nav className={open ? 'public-nav is-open' : 'public-nav'}>
          <Link to="/">Главная</Link><a href="/#levels">Уровни</a><a href="/#rating">Рейтинг</a><a href="/#competitions">Соревнования</a><a href="/#cities">Города</a>
        </nav>
        <div className="public-actions"><Link to="/login" className="text-link">Войти</Link><Link to="/register" className="button button-primary">Создать профиль</Link></div>
      </header>
      <Outlet />
      <footer className="public-footer"><Logo /><p>EagleCode — спортивная платформа развития Республики Дагестан</p><span className="eyebrow"><i className="status-dot" /> Все системы работают</span></footer>
    </div>
  );
}

