import CodeMirror, { EditorView } from '@uiw/react-codemirror';
import { python } from '@codemirror/lang-python';
import type { CodeEditorProps } from './CodeEditor';

const eagleTheme = EditorView.theme({
  '&': { color: '#e2e3e0', backgroundColor: '#0d0f0e', fontSize: '13.5px' },
  '.cm-content': { fontFamily: '"JetBrains Mono", "Cascadia Mono", monospace', caretColor: '#37e787', padding: '12px 0' },
  '.cm-gutters': { backgroundColor: '#0d0f0e', color: '#56645a', borderRight: '1px solid #1f2922' },
  '.cm-activeLine': { backgroundColor: 'rgba(55,231,135,.045)' },
  '.cm-activeLineGutter': { backgroundColor: 'rgba(55,231,135,.08)', color: '#8affaf' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#37e787' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { backgroundColor: 'rgba(55,231,135,.2) !important' },
  '&.cm-focused': { outline: 'none' },
}, { dark: true });

export default function CodeMirrorEditor({ value, onChange, readOnly = false, label, minHeight = '300px' }: CodeEditorProps) {
  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      readOnly={readOnly}
      editable={!readOnly}
      theme="dark"
      minHeight={minHeight}
      maxHeight="560px"
      extensions={[python(), eagleTheme, EditorView.contentAttributes.of({ 'aria-label': label })]}
      basicSetup={{ foldGutter: false, highlightActiveLine: !readOnly, autocompletion: !readOnly }}
    />
  );
}
