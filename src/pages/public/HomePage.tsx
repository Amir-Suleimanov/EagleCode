import { ArrowRight, Award, BarChart3, MapPinned, Medal, Mountain, ShieldCheck, Trophy, UsersRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CompetitionCard } from '../../components/features/CompetitionCard';
import { DagestanMap } from '../../components/features/DagestanMap';
import { RankingTable } from '../../components/features/RankingTable';
import { useAthletes, useCities, useCompetitions } from '../../hooks/useData';
import { eagleLevels } from '../../domain/eagleLevels';
import { Badge, Card, LoadingState, Progress } from '../../components/ui/Primitives';

export default function HomePage() {
  const athletes = useAthletes();
  const cities = useCities();
  const competitions = useCompetitions();
  if (!athletes.data || !cities.data || !competitions.data) return <LoadingState />;

  return (
    <main>
      <section className="hero public-section">
        <div className="hero-copy">
          <Badge tone="primary">СПОРТИВНЫЙ ДАГЕСТАН · СЕЗОН 2026</Badge>
          <h1>Характер. Развитие.<br/><span>Новая высота.</span></h1>
          <p>EagleCode объединяет спортсменов Дагестана. Участвуй в соревнованиях, подтверждай результаты, получай метры и поднимайся в рейтинге республики.</p>
          <div className="hero-actions"><Link to="/register" className="button button-primary">Создать профиль <ArrowRight size={18}/></Link><a href="#rating" className="button button-secondary"><BarChart3 size={18}/> Смотреть рейтинг</a></div>
          <div className="hero-stats"><div><strong>1 284+</strong><span>участника</span></div><div><strong>42</strong><span>города и района</span></div><div><strong>86</strong><span>соревнований</span></div><div><strong>3.8M+ м</strong><span>развития</span></div></div>
        </div>
        <Card className="hero-profile">
          <div className="card-meta"><Badge tone="primary">RANK #04</Badge><span className="eyebrow">МАХАЧКАЛА // РД</span></div>
          <div className="profile-inline"><span className="avatar avatar-large">МА</span><div><h3>Магомед Алиев</h3><p>Лёгкая атлетика · ДГТУ</p></div><ShieldCheck className="verified" /></div>
          <div className="tag-list"><span>Бег</span><span>Триатлон</span><span>I разряд</span></div>
          <div className="altitude-box"><small>Высота спортсмена</small><strong>12 480 <em>м</em></strong><Badge tone="gold">Орёл IV</Badge><Progress value={83} label="Прогресс до уровня Орёл V"/></div>
          <div className="event-line"><i className="status-dot"/> Кубок Дагестана <strong>+650 м</strong></div>
          <Link className="button button-secondary" to="/login">Открыть спортивный профиль</Link>
        </Card>
      </section>

      <section className="public-section steps-section"><div className="section-heading"><p className="eyebrow">АРХИТЕКТУРА РАЗВИТИЯ</p><h2>Как работает EagleCode</h2><p>Прозрачный путь от первого старта до вершины республиканского рейтинга.</p></div><div className="steps-grid">{[
        [UsersRound, '01', 'Создай профиль', 'Укажи организацию, дисциплины, разряд и свой населённый пункт.'],
        [Trophy, '02', 'Участвуй', 'Выбирай старты и подавай заявки прямо на платформе.'],
        [Mountain, '03', 'Получай метры', 'Результаты и достижения формируют твою спортивную высоту.'],
        [Medal, '04', 'Поднимайся', 'Открывай уровни Орла и представляй свой город в рейтинге.'],
      ].map(([Icon, number, title, text]) => <Card key={String(number)}><div className="step-icon"><span>{String(number)}</span><Icon /></div><h3>{String(title)}</h3><p>{String(text)}</p></Card>)}</div></section>

      <section className="public-section dark-band" id="levels"><div className="section-heading row"><div><p className="eyebrow">СИСТЕМА ВЫСОТЫ</p><h2>Твой путь: Орёл I–X</h2></div><Badge tone="gold">10 уровней</Badge></div><div className="levels-strip">{eagleLevels.map((level) => <Card key={level.id} className={level.id === 'IV' ? 'active-level' : ''}><span>ОРЁЛ {level.id}</span><Award/><strong>{level.name}</strong><small>от {level.minMeters.toLocaleString('ru-RU')} м</small></Card>)}</div></section>

      <section className="public-section" id="rating"><div className="section-heading"><p className="eyebrow">ОФИЦИАЛЬНЫЙ РЕЙТИНГ</p><h2>Спортивные таланты Дагестана</h2><p>Позиции рассчитываются по подтверждённым протоколам и начисленным метрам.</p></div><Card><RankingTable athletes={athletes.data} cities={cities.data} limit={4}/></Card></section>

      <section className="public-section dark-band" id="competitions"><div className="section-heading"><p className="eyebrow">БЛИЖАЙШИЕ СТАРТЫ</p><h2>Соревнования сезона</h2></div><div className="card-grid card-grid-2">{competitions.data.slice(0, 4).map((item) => <CompetitionCard key={item.id} competition={item}/>)}</div></section>

      <section className="public-section" id="cities"><div className="section-heading"><p className="eyebrow">РЕГИОНАЛЬНАЯ ТОПОЛОГИЯ</p><h2>Карта спортивного Дагестана</h2></div><div className="map-layout"><DagestanMap cities={cities.data} athletes={athletes.data}/><Card><h3>Топ городов республики</h3>{cities.data.map((city, index) => { const total = athletes.data.filter((a) => a.cityId === city.id).reduce((sum, a) => sum + a.meters, 0); return <div className="city-row" key={city.id}><span>#{index + 1}</span><div><strong>{city.name}</strong><small>{city.district}</small></div><b>{total.toLocaleString('ru-RU')} м</b></div>; })}</Card></div></section>

      <section className="public-section final-cta"><MapPinned/><div><p className="eyebrow">WELCOME TO EAGLECODE 2026</p><h2>Твоя спортивная высота начинается здесь.</h2><p>Создай профиль, выбери дисциплины и подай заявку на ближайшее соревнование.</p></div><Link className="button button-primary" to="/register">Создать профиль <ArrowRight/></Link></section>
    </main>
  );
}

