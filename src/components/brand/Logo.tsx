import { Bird } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Logo({ admin = false }: { admin?: boolean }) {
  return (
    <Link to={admin ? '/admin' : '/'} className="logo" aria-label="EagleCode — главная">
      <span className="logo-mark"><Bird size={22} /></span>
      <span><strong>EagleCode</strong><small>{admin ? 'ADMIN // RD_CORE' : 'SPORT // DAGESTAN'}</small></span>
    </Link>
  );
}

