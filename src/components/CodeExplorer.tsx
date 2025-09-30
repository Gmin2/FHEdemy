import { useEffect, useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'

export function CodeExplorer({ title, code, language, highlight }: { title: string; code: string; language: string; highlight: [number, number] | null }) {
  const editorRef = useRef<any>(null)
  const decorationsRef = useRef<string[]>([])

  const onMount: OnMount = (editor) => {
    editorRef.current = editor
    applyHighlight()
  }

  const applyHighlight = () => {
    const editor = editorRef.current
    if (!editor) return
    if (!highlight) {
      decorationsRef.current = editor.deltaDecorations(decorationsRef.current, [])
      return
    }
    const [start, end] = highlight
    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      [
        {
          range: { startLineNumber: start, startColumn: 1, endLineNumber: end, endColumn: 1 },
          options: { isWholeLine: true, className: 'code-highlight' },
        },
      ]
    )
    editor.revealLineInCenter(start)
  }

  useEffect(() => {
    applyHighlight()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [highlight, title])

  return (
    <div className="code-explorer">
      <div className="code-header">
        <span>{title}</span>
      </div>
      <div className="code-editor">
        <Editor height="100%" defaultLanguage={language} value={code} onMount={onMount} options={{ readOnly: true, minimap: { enabled: false }, fontSize: 13, wordWrap: 'on', scrollBeyondLastLine: false }} />
      </div>
    </div>
  )
}
