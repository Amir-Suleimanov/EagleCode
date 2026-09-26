import { useState, type FormEvent } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { PROGRAMMING_DISCIPLINES, toLocalInput } from '../../domain/contest';
import type { CheckType, Competition, ContestInput, ContestTask, GradeInput, Submission, TaskInput, TestCase } from '../../types';
import { Button, Field, Input, Select, Textarea } from '../ui/Primitives';

const text = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const inHours = (hours: number) => new Date(Date.now() + hours * 3_600_000).toISOString();

interface ContestFormProps { initial?: Competition; busy: boolean; error?: string; submitLabel: string; onSubmit: (input: ContestInput) => void }

export function ContestForm({ initial, busy, error, submitLabel, onSubmit }: ContestFormProps) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      title: text(form, 'title'), description: text(form, 'description'), discipline: text(form, 'discipline'),
      startsAt: new Date(text(form, 'startsAt')).toISOString(), endsAt: new Date(text(form, 'endsAt')).toISOString(),
      rewardMeters: Number(form.get('rewardMeters')), rules: text(form, 'rules'),
      externalPlatform: text(form, 'externalPlatform'), externalUrl: text(form, 'externalUrl'),
    });
  };
  return (
    <form className="form-stack" onSubmit={submit}>
      <Field label="Название" htmlFor="ct-title"><Input id="ct-title" name="title" defaultValue={initial?.title} placeholder="Тестовый контест по алгоритмическому программированию" required /></Field>
      <Field label="Краткое описание" htmlFor="ct-description"><Textarea id="ct-description" name="description" rows={3} defaultValue={initial?.description} required /></Field>
      <Field label="Дисциплина" htmlFor="ct-discipline"><Select id="ct-discipline" name="discipline" defaultValue={initial?.discipline ?? PROGRAMMING_DISCIPLINES[0]}>{PROGRAMMING_DISCIPLINES.map((item) => <option key={item}>{item}</option>)}</Select></Field>
      <div className="form-grid">
        <Field label="Начало" htmlFor="ct-start"><Input id="ct-start" name="startsAt" type="datetime-local" defaultValue={toLocalInput(initial?.startsAt ?? inHours(1))} required /></Field>
        <Field label="Окончание" htmlFor="ct-end"><Input id="ct-end" name="endsAt" type="datetime-local" defaultValue={toLocalInput(initial?.endsAt ?? inHours(4))} required /></Field>
      </div>
      <Field label="Правила для участников" htmlFor="ct-rules" hint="Показываются на странице контеста."><Textarea id="ct-rules" name="rules" rows={4} defaultValue={initial?.rules ?? 'Решения на Python 3.12: ввод из stdin, вывод в stdout. Засчитывается лучшая попытка, балл — доля пройденных тестов.'} /></Field>
      <Field label="Максимум метров в рейтинг" htmlFor="ct-meters" hint="Участник получает долю, равную доле набранных баллов."><Input id="ct-meters" name="rewardMeters" type="number" min="0" defaultValue={initial?.rewardMeters ?? 1000} required /></Field>
      <div className="form-grid">
        <Field label="Внешняя площадка" htmlFor="ct-platform" hint="Необязательно, например Codeforces"><Input id="ct-platform" name="externalPlatform" defaultValue={initial?.externalPlatform} /></Field>
        <Field label="Ссылка на внешний контест" htmlFor="ct-url"><Input id="ct-url" name="externalUrl" type="url" defaultValue={initial?.externalUrl} placeholder="https://" /></Field>
      </div>
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" busy={busy}>{submitLabel}</Button>
    </form>
  );
}

interface TaskFormProps { competitionId: string; nextOrder: number; task?: ContestTask; tests: TestCase[]; busy: boolean; error?: string; onSubmit: (input: TaskInput, tests: TestCase[]) => void }

export function TaskForm({ competitionId, nextOrder, task, tests: initialTests, busy, error, onSubmit }: TaskFormProps) {
  const [checkType, setCheckType] = useState<CheckType>(task?.checkType ?? 'auto');
  const [tests, setTests] = useState<TestCase[]>(initialTests.length ? initialTests : [{ input: '', expectedOutput: '', isSample: true }]);
  const updateTest = (index: number, patch: Partial<TestCase>) => setTests((current) => current.map((test, position) => position === index ? { ...test, ...patch } : test));
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({
      competitionId, order: Number(form.get('order')), title: text(form, 'title'), statement: text(form, 'statement'),
      maxScore: Number(form.get('maxScore')), checkType, timeLimitMs: Number(form.get('timeLimitMs') ?? 1000),
      memoryLimitMb: Number(form.get('memoryLimitMb') ?? 256), materialsUrl: text(form, 'materialsUrl'),
    }, checkType === 'auto' ? tests.filter((test) => test.expectedOutput.trim()) : []);
  };
  return (
    <form className="form-stack" onSubmit={submit}>
      <div className="form-grid form-grid-order">
        <Field label="№" htmlFor="tk-order"><Input id="tk-order" name="order" type="number" min="1" defaultValue={task?.order ?? nextOrder} required /></Field>
        <Field label="Название" htmlFor="tk-title"><Input id="tk-title" name="title" defaultValue={task?.title} required /></Field>
      </div>
      <Field label="Условие" htmlFor="tk-statement"><Textarea id="tk-statement" name="statement" rows={7} defaultValue={task?.statement} placeholder="Формат ввода, формат вывода, ограничения…" required /></Field>
      <div className="form-grid">
        <Field label="Максимум баллов" htmlFor="tk-score"><Input id="tk-score" name="maxScore" type="number" min="1" max="1000" defaultValue={task?.maxScore ?? 100} required /></Field>
        <Field label="Проверка" htmlFor="tk-check"><Select id="tk-check" value={checkType} onChange={(event) => setCheckType(event.target.value as CheckType)}><option value="auto">Автоматическая (тесты)</option><option value="manual">Ручная (текст / ссылка)</option></Select></Field>
      </div>
      {checkType === 'auto' && (
        <div className="form-grid">
          <Field label="Лимит времени, мс" htmlFor="tk-time"><Input id="tk-time" name="timeLimitMs" type="number" min="100" max="10000" step="100" defaultValue={task?.timeLimitMs ?? 1000} /></Field>
          <Field label="Лимит памяти, МБ" htmlFor="tk-memory"><Input id="tk-memory" name="memoryLimitMb" type="number" min="32" max="512" defaultValue={task?.memoryLimitMb ?? 256} /></Field>
        </div>
      )}
      <Field label="Материалы (ссылка)" htmlFor="tk-materials" hint="Необязательно: файл, презентация, репозиторий."><Input id="tk-materials" name="materialsUrl" type="url" defaultValue={task?.materialsUrl} placeholder="https://" /></Field>
      {checkType === 'auto' && (
        <fieldset className="tests-editor">
          <legend>Тесты · {tests.length}</legend>
          <p className="muted">Балл = максимум × доля пройденных тестов. Отмеченные «пример» видны участникам в условии.</p>
          {tests.map((test, index) => (
            <div className="test-row" key={index}>
              <span className="task-letter">{index + 1}</span>
              <Textarea aria-label={`Ввод теста ${index + 1}`} rows={2} value={test.input} placeholder="ввод" onChange={(event) => updateTest(index, { input: event.target.value })} />
              <Textarea aria-label={`Ответ теста ${index + 1}`} rows={2} value={test.expectedOutput} placeholder="ответ" onChange={(event) => updateTest(index, { expectedOutput: event.target.value })} />
              <label className="check-inline"><input type="checkbox" checked={test.isSample} onChange={(event) => updateTest(index, { isSample: event.target.checked })} /> пример</label>
              <button type="button" className="icon-button" aria-label={`Удалить тест ${index + 1}`} onClick={() => setTests((current) => current.filter((_, position) => position !== index))}><Trash2 size={16} /></button>
            </div>
          ))}
          <Button type="button" variant="secondary" onClick={() => setTests((current) => [...current, { input: '', expectedOutput: '', isSample: false }])}><Plus size={16} /> Добавить тест</Button>
        </fieldset>
      )}
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" busy={busy}>{task ? 'Сохранить задание' : 'Добавить задание'}</Button>
    </form>
  );
}

export function GradeForm({ submission, busy, error, onSubmit }: { submission: Submission; busy: boolean; error?: string; onSubmit: (input: GradeInput) => void }) {
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    onSubmit({ manualScore: Number(form.get('manualScore')), comment: text(form, 'comment') });
  };
  return (
    <form className="form-stack grade-form" onSubmit={submit}>
      <p className="eyebrow">ОЦЕНКА ОРГАНИЗАТОРА</p>
      <Field label={`Баллы (0–${submission.maxScore})`} htmlFor="grade-score" hint={submission.autoScore !== null ? `Автопроверка: ${submission.autoScore}. Ручная оценка заменит её.` : undefined}>
        <Input id="grade-score" name="manualScore" type="number" min="0" max={submission.maxScore} defaultValue={submission.manualScore ?? submission.autoScore ?? ''} required />
      </Field>
      <Field label="Комментарий участнику" htmlFor="grade-comment"><Textarea id="grade-comment" name="comment" rows={3} defaultValue={submission.comment} /></Field>
      {error && <p className="form-error" role="alert">{error}</p>}
      <Button type="submit" busy={busy}>Сохранить оценку</Button>
    </form>
  );
}
