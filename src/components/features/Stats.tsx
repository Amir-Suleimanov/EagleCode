import type { LucideIcon } from 'lucide-react';
import { ArrowUpRight } from 'lucide-react';
import { Card, Progress } from '../ui/Primitives';

interface MetricCardProps { label: string; value: string; note: string; icon: LucideIcon; progress?: number; tone?: 'primary' | 'gold' }
export function MetricCard({ label, value, note, icon: Icon, progress, tone = 'primary' }: MetricCardProps) {
  return (
    <Card className={`metric-card metric-${tone}`}>
      <div className="metric-label"><span>{label}</span><Icon size={18} /></div>
      <strong>{value}</strong>
      <small><ArrowUpRight size={13} /> {note}</small>
      {progress !== undefined && <Progress value={progress} label={`${label}: ${progress}%`} />}
    </Card>
  );
}

export function LineChart({ title = 'Динамика набора метров' }: { title?: string }) {
  return (
    <div className="line-chart" aria-label={title} role="img">
      <svg viewBox="0 0 760 240" preserveAspectRatio="none">
        <defs><linearGradient id="chart-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#37e787" stopOpacity=".34"/><stop offset="1" stopColor="#37e787" stopOpacity="0"/></linearGradient></defs>
        {[40, 90, 140, 190].map((y) => <line key={y} x1="0" y1={y} x2="760" y2={y} className="chart-grid" />)}
        <path d="M0 205 C100 190 145 178 220 172 S330 132 400 126 S520 114 585 78 S690 58 760 25 L760 240 L0 240Z" fill="url(#chart-fill)" />
        <path d="M0 205 C100 190 145 178 220 172 S330 132 400 126 S520 114 585 78 S690 58 760 25" className="chart-line" />
        <circle cx="585" cy="78" r="5" className="chart-dot" />
      </svg>
      <div className="chart-caption"><span>Май</span><span>Июнь</span><span>Июль</span><span>Август</span><span>Сентябрь</span></div>
    </div>
  );
}

