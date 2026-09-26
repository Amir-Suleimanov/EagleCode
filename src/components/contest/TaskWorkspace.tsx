import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Clock3, Copy, ExternalLink, MemoryStick, Send } from 'lucide-react';
import { dataClient } from '../../services/client';
import type { ContestTask } from '../../types';
import { Badge, Button, Card, Field, Textarea } from '../ui/Primitives';
import { CodeEditor } from './CodeEditor';

const STARTER = 'import sys\n\n\ndef main():\n    data = sys.stdin.read().split()\n    \n\n\nmain()\n';
const draftKey = (taskId: string) => `eaglecode.draft.${taskId}`;
const readDraft = (taskId: string) => { try { return localStorage.getItem(draftKey(taskId)); } catch { return null; } };
const saveDraft = (taskId: string, value: string) => { try { localStorage.setItem(draftKey(taskId), value); } catch { /* drafts are a convenience only */ } };

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button type="button" className="icon-button copy-button" aria-label={label} onClick={() => { void navigator.clipboard?.writeText(text).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1200); }); }}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  );
}

export function TaskStatement({ task, letter }: { task: ContestTask; letter: string }) {
  return (
    <Card as="article" className="task-statement">
      <div className="task-statement-head">
        <div><p className="eyebrow">ЗАДАНИЕ // {letter}</p><h2>{task.title}</h2></div>
        <Badge tone="gold">{task.maxScore} баллов</Badge>
      </div>
      <div className="task-limits">
        {task.checkType === 'auto'
          ? <><span><Clock3 size={14} /> {task.timeLimitMs / 1000} с</span><span><MemoryStick size={14} /> {task.memoryLimitMb} МБ</span><span>Python 3.12 · {task.testCount} тестов</span></>
          : <span>Ручная проверка организатором</span>}
      </div>
      <div className="statement-text">{task.statement}</div>
      {task.materialsUrl && <a className="text-link materials-link" href={task.materialsUrl} target="_blank" rel="noreferrer"><ExternalLink size={14} /> Материалы к заданию</a>}
      {task.samples.map((sample, index) => (
        <div className="sample-grid" key={index}>
          <div><div className="sample-head"><span>Ввод #{index + 1}</span><CopyButton text={sample.input} label={`Скопировать ввод примера ${index + 1}`} /></div><pre>{sample.input || ' '}</pre></div>
          <div><div className="sample-head"><span>Вывод #{index + 1}</span><CopyButton text={sample.expectedOutput} label={`Скопировать вывод примера ${index + 1}`} /></div><pre>{sample.expectedOutput}</pre></div>
        </div>
      ))}
    </Card>
  );
}

export function SubmitPanel({ task, disabled }: { task: ContestTask; disabled: boolean }) {
  const auto = task.checkType === 'auto';
  const [source, setSource] = useState(() => readDraft(task.id) ?? (auto ? STARTER : ''));
  const queryClient = useQueryClient();
  useEffect(() => { saveDraft(task.id, source); }, [task.id, source]);
  const submit = useMutation({
    mutationFn: () => dataClient.submitSolution({ taskId: task.id, language: auto ? 'python' : 'text', source }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['submissions'] });
      queryClient.invalidateQueries({ queryKey: ['standings'] });
    },
  });
  return (
    <Card className="submit-panel">
      <div className="card-title"><div><p className="eyebrow">{auto ? 'SOLUTION // PYTHON 3.12' : 'ANSWER // TEXT'}</p><h3>{auto ? 'Решение' : 'Ответ или ссылка'}</h3></div>{auto && <Badge>stdin → stdout</Badge>}</div>
      {auto
        ? <CodeEditor value={source} onChange={setSource} label={`Код решения задачи ${task.title}`} />
        : <Field label="Текст ответа или ссылка на работу" htmlFor={`answer-${task.id}`}><Textarea id={`answer-${task.id}`} rows={7} value={source} onChange={(event) => setSource(event.target.value)} placeholder="Опишите решение или вставьте ссылку на репозиторий…" /></Field>}
      {submit.isError && <p className="form-error" role="alert">{submit.error.message}</p>}
      <div className="submit-row">
        <small className="muted">{disabled ? 'Приём решений закрыт.' : auto ? 'Черновик сохраняется в браузере. Засчитывается лучшая попытка.' : 'Ответ проверит организатор.'}</small>
        <Button onClick={() => submit.mutate()} busy={submit.isPending} disabled={disabled || !source.trim()}><Send size={16} /> Отправить</Button>
      </div>
    </Card>
  );
}
