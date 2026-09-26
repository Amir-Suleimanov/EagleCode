import type { Athlete, City } from '../../types';

interface DagestanMapProps { cities: City[]; athletes: Athlete[]; activeCityId?: string; onSelect?: (id: string) => void }
export function DagestanMap({ cities, athletes, activeCityId = 'c1', onSelect }: DagestanMapProps) {
  const positions = [[55, 48], [69, 76], [27, 37], [58, 57], [39, 48]];
  return (
    <div className="dagestan-map" role="img" aria-label="Схематичная карта спортивной активности Дагестана">
      <svg viewBox="0 0 500 420" aria-hidden="true"><path d="M310 20 395 58l18 72 52 64-31 63 17 81-83 58-74-31-71 33-76-44-18-73-52-47 33-70 7-87 88-17z" className="region-shape"/><path d="M126 120 395 315M102 235l338-73M201 59l94 306" className="map-grid"/></svg>
      {cities.map((city, index) => {
        const cityMeters = athletes.filter((item) => item.cityId === city.id).reduce((sum, item) => sum + item.meters, 0);
        return <button key={city.id} type="button" className={city.id === activeCityId ? 'map-node active' : 'map-node'} style={{ left: `${positions[index]?.[0] ?? 50}%`, top: `${positions[index]?.[1] ?? 50}%` }} onClick={() => onSelect?.(city.id)}><i/><span><strong>{city.name}</strong><small>{cityMeters.toLocaleString('ru-RU')} м</small></span></button>;
      })}
    </div>
  );
}
