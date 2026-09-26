/* eslint-disable react-refresh/only-export-components */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

interface CardProps { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' }
export function Card({ children, className, as: Tag = 'div' }: CardProps) {
  return <Tag className={cx('card', className)}>{children}</Tag>;
}

interface BadgeProps { children: ReactNode; tone?: 'primary' | 'gold' | 'danger' | 'muted'; className?: string }
export function Badge({ children, tone = 'muted', className }: BadgeProps) {
  return <span className={cx('badge', `badge-${tone}`, className)}>{children}</span>;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  busy?: boolean;
}
export function Button({ children, variant = 'primary', busy, className, disabled, ...props }: ButtonProps) {
  return (
    <button className={cx('button', `button-${variant}`, className)} disabled={disabled || busy} {...props}>
      {busy && <LoaderCircle size={16} className="spin" aria-hidden="true" />}
      {children}
    </button>
  );
}

interface FieldProps { label: string; htmlFor: string; hint?: string; children: ReactNode }
export function Field({ label, htmlFor, hint, children }: FieldProps) {
  return <div className="field"><label htmlFor={htmlFor}>{label}</label>{children}{hint && <small>{hint}</small>}</div>;
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx('input', props.className)} {...props} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx('input', props.className)} {...props} />;
}

interface ProgressProps { value: number; label?: string }
export function Progress({ value, label }: ProgressProps) {
  return <div className="progress-wrap">{label && <span className="sr-only">{label}</span>}<div className="progress" role="progressbar" aria-label={label} aria-valuenow={value} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${value}%` }} /></div></div>;
}

export function LoadingState() {
  return <div className="state-message"><LoaderCircle className="spin" aria-hidden="true" /> Загрузка данных…</div>;
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <Card className="empty-state"><strong>{title}</strong><p>{description}</p></Card>;
}

export function ErrorState({ onRetry }: { onRetry?: () => void }) {
  return (
    <Card className="empty-state">
      <strong>Не удалось загрузить данные</strong>
      <p>Проверьте подключение к сети и попробуйте ещё раз.</p>
      {onRetry && <Button type="button" onClick={onRetry}>Повторить</Button>}
    </Card>
  );
}
