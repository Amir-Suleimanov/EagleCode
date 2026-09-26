import { Medal, Timer, Trophy } from 'lucide-react';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Card, LoadingState } from '../../components/ui/Primitives';
import { useAuth } from '../../contexts/AuthContext';
import { useCompetitions, useResults } from '../../hooks/useData';

export default function ResultsPage() {
  const { user } = useAuth(); const results = useResults(); const competitions = useCompetitions();
  if (!results.data || !competitions.data) return <LoadingState/>;
  const own = results.data.filter((item) => item.athleteId === user?.athleteId);
  return <><PageHeader eyebrow="OFFICIAL PROTOCOLS" title="Мои результаты" description="Опубликованные протоколы, места и начисленные метры."/><div className="metric-grid"><Card className="summary-tile"><Trophy/><span><small>Стартов</small><strong>9</strong></span></Card><Card className="summary-tile"><Medal/><span><small>Призовых мест</small><strong>3</strong></span></Card><Card className="summary-tile"><Timer/><span><small>Лучший темп</small><strong>4:18 / км</strong></span></Card></div><Card>{own.length ? <div className="result-list">{own.map((result) => { const competition = competitions.data.find((item) => item.id === result.competitionId); return <article key={result.id}><span className="result-place">#{result.place}</span><div><h3>{competition?.title}</h3><p>{competition?.location} · {new Date(result.publishedAt).toLocaleDateString('ru-RU')}</p></div><Badge tone="primary">{result.score}</Badge><strong>+{result.metersAwarded} м</strong></article>; })}</div> : <p>Опубликованных результатов пока нет.</p>}</Card></>;
}

