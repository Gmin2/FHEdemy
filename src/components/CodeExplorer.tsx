import { useEffect, useRef } from 'react'
import Editor, { OnMount } from '@monaco-editor/react'
import type { editor } from 'monaco-editor'

export function CodeExplorer({ title, code, language, highlight }: { title: string; code: string; language: string; highlight: [number, number] | null }) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<string[]>([])

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor

    // Define custom cyberpunk theme with better syntax highlighting
    monaco.editor.defineTheme('fhevm-cyberpunk', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Comments
        { token: 'comment', foreground: '9ba6c9', fontStyle: 'italic' },
        { token: 'comment.doc', foreground: '9ba6c9', fontStyle: 'italic' },

        // Keywords
        { token: 'keyword', foreground: 'ff5b9d', fontStyle: 'bold' },
        { token: 'keyword.control', foreground: 'ff5b9d', fontStyle: 'bold' },

        // Strings
        { token: 'string', foreground: '7dffb3' },
        { token: 'string.quote', foreground: '7dffb3' },

        // Numbers
        { token: 'number', foreground: 'ffd36a' },
        { token: 'number.hex', foreground: 'ffd36a' },

        // Types & Identifiers
        { token: 'type', foreground: '78a6ff' },
        { token: 'type.identifier', foreground: '78a6ff' },
        { token: 'identifier', foreground: 'e9eefc' },

        // Functions
        { token: 'function', foreground: '9ad0ff' },
        { token: 'identifier.function', foreground: '9ad0ff' },

        // Operators & Delimiters
        { token: 'operator', foreground: 'ff5b9d' },
        { token: 'delimiter', foreground: 'e9eefc' },
        { token: 'delimiter.bracket', foreground: 'e9eefc' },

        // Special for Solidity
        { token: 'annotation', foreground: 'ffd36a' },
        { token: 'namespace', foreground: '78a6ff' },
      ],
      colors: {
        'editor.background': '#0a0e1c',
        'editor.foreground': '#e9eefc',
        'editorLineNumber.foreground': '#9ba6c9',
        'editorLineNumber.activeForeground': '#78a6ff',
        'editor.lineHighlightBackground': '#1b224022',
        'editor.selectionBackground': '#78a6ff33',
        'editor.inactiveSelectionBackground': '#78a6ff22',
        'editorCursor.foreground': '#78a6ff',
        'editorWhitespace.foreground': '#9ba6c920',
        'editorIndentGuide.background': '#1b224033',
        'editorIndentGuide.activeBackground': '#1b224066',
      }
    })

    monaco.editor.setTheme('fhevm-cyberpunk')
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
        <Editor
          height="100%"
          defaultLanguage={language}
          language={language}
          value={code}
          onMount={onMount}
          theme="fhevm-cyberpunk"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            fontLigatures: true,
            lineNumbers: 'on',
            lineNumbersMinChars: 3,
            wordWrap: 'on',
            scrollBeyondLastLine: false,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
            renderLineHighlight: 'none',
            overviewRulerLanes: 0,
            hideCursorInOverviewRuler: true,
            overviewRulerBorder: false,
            padding: { top: 16, bottom: 16 },
          }}
        />
      </div>
    </div>
  )
}
