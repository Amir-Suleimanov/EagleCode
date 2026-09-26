import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface OverlayProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  kind?: 'modal' | 'drawer';
}

export function Overlay({ open, title, children, onClose, kind = 'modal' }: OverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="overlay-backdrop" onMouseDown={onClose}>
      <section className={`overlay-panel overlay-${kind}`} role="dialog" aria-modal="true" aria-labelledby="overlay-title" onMouseDown={(event) => event.stopPropagation()}>
        <header><h2 id="overlay-title">{title}</h2><button className="icon-button" type="button" onClick={onClose} aria-label="Закрыть"><X /></button></header>
        <div className="overlay-body">{children}</div>
      </section>
    </div>
  );
}

