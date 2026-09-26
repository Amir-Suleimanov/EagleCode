import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { BarChart3, Plus } from 'lucide-react';
import { LineChart } from '../../components/features/Stats';
import { PageHeader } from '../../components/layout/PageHeader';
import { Badge, Button, Card, Field, Input, LoadingState, Select } from '../../components/ui/Primitives';
import { Overlay } from '../../components/ui/Overlay';
import { useAthletes, useTransactions } from '../../hooks/useData';
import { dataClient } from '../../services/client';
import type { MeterInput } from '../../types';

export default function AdminRatingPage() {
  const athletes = useAthletes(); const transactions = useTransactions(); const [open, setOpen] = useState(false); const queryClient = useQueryClient();
  const add = useMutation({ mutationFn: (input: MeterInput) => dataClient.addMeters(input), onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); queryClient.invalidateQueries({ queryKey: ['athletes'] }); setOpen(false); } });
  if (!athletes.data || !transactions.data) return <LoadingState/>;
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); add.mutate({ athleteId: String(form.get('athleteId')), amount: Number(form.get('amount')), reason: String(form.get('reason')), protocol: String(form.get('protocol')) }); };
  return <><PageHeader eyebrow="RATING ENGINE // LEDGER" title="Рейтинг и метры" description="Ручные корректировки, автоматические начисления и журнал операций." actions={<Button onClick={() => setOpen(true)}><Plus/> Начислить метры</Button>}/><Card><div className="card-title"><div><p className="eyebrow">DIGITAL EAGLE FLIGHT</p><h2>Динамика начислений</h2></div><Badge tone="primary">SYNCED</Badge></div><LineChart/></Card><Card><div className="card-title"><h2>Журнал операций</h2><BarChart3/></div><div className="table-scroll"><table className="data-table"><thead><tr><th>Дата</th><th>Участник</th><th>Основание</th><th>Протокол</th><th className="align-right">Метры</th></tr></thead><tbody>{transactions.data.map((item) => <tr key={item.id}><td>{new Date(item.createdAt).toLocaleDateString('ru-RU')}</td><td>{athletes.data.find((entry) => entry.id === item.athleteId)?.fullName}</td><td>{item.reason}</td><td><Badge>{item.protocol}</Badge></td><td className="align-right metric-number">{item.amount > 0 ? '+' : ''}{item.amount} м</td></tr>)}</tbody></table></div></Card><Overlay open={open} title="Начислить метры" kind="drawer" onClose={() => setOpen(false)}><form className="form-stack" onSubmit={submit}><Field label="Участник" htmlFor="meter-athlete"><Select id="meter-athlete" name="athleteId">{athletes.data.map((item) => <option value={item.id} key={item.id}>{item.fullName}</option>)}</Select></Field><Field label="Основание" htmlFor="meter-reason"><Input id="meter-reason" name="reason" required/></Field><Field label="Количество метров" htmlFor="meter-amount"><Input id="meter-amount" name="amount" type="number" required/></Field><Field label="Протокол / приказ" htmlFor="meter-protocol"><Input id="meter-protocol" name="protocol" required/></Field><Button type="submit" busy={add.isPending}>Записать в реестр</Button></form></Overlay></>;
}
