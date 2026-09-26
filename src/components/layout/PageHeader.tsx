import { useEffect, type ReactNode } from 'react';

interface PageHeaderProps { eyebrow: string; title: string; description: string; actions?: ReactNode }
export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  useEffect(() => {
    document.title = `${title} — EagleCode`;
    return () => { document.title = 'EagleCode — спортивный рейтинг Дагестана'; };
  }, [title]);
  return (
    <header className="page-header">
      <div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}
