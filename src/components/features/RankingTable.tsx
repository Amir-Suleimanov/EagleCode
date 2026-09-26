import { Medal } from 'lucide-react';
import type { Athlete, City } from '../../types';
import type { EagleLevel } from '../../types';
import { eagleLevels, getEagleProgress } from '../../domain/eagleLevels';
import { Badge } from '../ui/Primitives';

interface RankingTableProps { athletes: Athlete[]; cities: City[]; limit?: number; levels?: EagleLevel[] }
export function RankingTable({ athletes, cities, limit, levels = eagleLevels }: RankingTableProps) {
  const rows = limit ? athletes.slice(0, limit) : athletes;
  return (
    <div className="table-scroll">
      <table className="data-table">
        <thead><tr><th>Место</th><th>Участник</th><th>Организация</th><th>Дисциплины</th><th>Уровень</th><th className="align-right">Метры</th></tr></thead>
        <tbody>{rows.map((athlete, index) => {
          const level = getEagleProgress(athlete.meters, levels).level;
          return <tr key={athlete.id}><td><span className={`rank rank-${index + 1}`}>{index < 3 && <Medal size={14}/>}#{String(index + 1).padStart(2, '0')}</span></td><td><div className="person-cell"><span className="avatar">{athlete.avatarInitials}</span><span><strong>{athlete.fullName}</strong><small>{cities.find((city) => city.id === athlete.cityId)?.name}</small></span></div></td><td>{athlete.organization}</td><td><div className="tag-list">{athlete.disciplines.map((item) => <span key={item}>{item}</span>)}</div></td><td><Badge tone="gold">Орёл {level.id}</Badge></td><td className="align-right metric-number">{athlete.meters.toLocaleString('ru-RU')} м</td></tr>;
        })}</tbody>
      </table>
    </div>
  );
}

