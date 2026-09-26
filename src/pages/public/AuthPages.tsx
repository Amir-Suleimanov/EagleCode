import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from '../../components/brand/Logo';
import { Button, Field, Input, Select } from '../../components/ui/Primitives';
import { useAuth } from '../../contexts/AuthContext';
import { useCities } from '../../hooks/useData';

export function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/app/profile'} replace/>;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); setError('');
    const data = new FormData(event.currentTarget);
    try { const session = await login({ email: String(data.get('email')), password: String(data.get('password')) }); navigate((location.state as { from?: string } | null)?.from ?? (session.role === 'admin' ? '/admin' : '/app/profile')); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Не удалось войти'); }
    finally { setBusy(false); }
  };
  return <AuthShell title="Войти в EagleCode" subtitle="Используйте демо-доступ спортсмена или администратора."><form onSubmit={submit} className="auth-form"><Field label="Email" htmlFor="login-email"><Input id="login-email" name="email" type="email" autoComplete="email" defaultValue="athlete@eaglecode.ru" required/></Field><Field label="Пароль" htmlFor="login-password" hint="Для демо: demo123"><Input id="login-password" name="password" type="password" autoComplete="current-password" defaultValue="demo123" required/></Field>{error && <p className="form-error" role="alert">{error}</p>}<Button type="submit" busy={busy}>Войти в профиль</Button><button type="button" className="text-link centered" onClick={() => navigate('/register')}>Создать новый профиль</button></form></AuthShell>;
}

export function RegisterPage() {
  const { user, register } = useAuth();
  const cities = useCities();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/app/profile'} replace/>;
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); setBusy(true); const data = new FormData(event.currentTarget);
    await register({ fullName: String(data.get('fullName')), email: String(data.get('email')), password: String(data.get('password')), cityId: String(data.get('cityId')), organization: String(data.get('organization')) });
    navigate('/app/profile');
  };
  return <AuthShell title="Создать профиль" subtitle="Начните путь в спортивном рейтинге Дагестана."><form onSubmit={submit} className="auth-form"><Field label="ФИО" htmlFor="fullName"><Input id="fullName" name="fullName" autoComplete="name" required/></Field><Field label="Email" htmlFor="email"><Input id="email" name="email" type="email" autoComplete="email" required/></Field><Field label="Организация" htmlFor="organization"><Input id="organization" name="organization" autoComplete="organization" required/></Field><Field label="Населённый пункт" htmlFor="cityId"><Select id="cityId" name="cityId" autoComplete="address-level2" required>{cities.data?.map((city) => <option value={city.id} key={city.id}>{city.name}</option>)}</Select></Field><Field label="Пароль" htmlFor="password"><Input id="password" name="password" type="password" autoComplete="new-password" minLength={6} required/></Field><Button type="submit" busy={busy}>Создать профиль</Button></form></AuthShell>;
}

function AuthShell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <main className="auth-page"><section className="auth-aside"><Logo/><div><p className="eyebrow">СПОРТИВНАЯ ВЫСОТА // РД</p><h1>Сильнее каждый старт.</h1><p>Официальные результаты, единый рейтинг и траектория развития спортсмена.</p></div></section><section className="auth-card"><div><p className="eyebrow">SECURE PROFILE NODE</p><h2>{title}</h2><p>{subtitle}</p></div>{children}</section></main>;
}
