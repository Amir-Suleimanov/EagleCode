import { lazy, Suspense } from 'react';

export interface CodeEditorProps { value: string; onChange?: (value: string) => void; readOnly?: boolean; label: string; minHeight?: string }

const CodeMirrorEditor = lazy(() => import('./CodeMirrorEditor'));

/** CodeMirror is ~150 KB, so it loads only when a code field is actually on screen. */
export function CodeEditor(props: CodeEditorProps) {
  return (
    <div className="code-editor">
      <Suspense fallback={<pre className="code-fallback" aria-label={props.label}>{props.value || ' '}</pre>}>
        <CodeMirrorEditor {...props} />
      </Suspense>
    </div>
  );
}
