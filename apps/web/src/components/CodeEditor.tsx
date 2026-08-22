import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

type MonacoNamespace = Awaited<ReturnType<typeof import('modern-monaco').init>>

interface CodeEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  language: string
  placeholder?: string
  ariaLabel?: string
  /** Extra classes for the editor surface, e.g. custom heights */
  editorClassName?: string
}

let monacoPromise: Promise<MonacoNamespace> | null = null

function loadMonaco(): Promise<MonacoNamespace> {
  monacoPromise ??= import('modern-monaco').then(m =>
    m.init({
      themes: ['github-light-default', 'github-dark-default'],
    }),
  )
  return monacoPromise
}

/**
 * Monaco-based code editor (esm-dev/modern-monaco).
 * Editor modules load lazily on first mount; highlighting uses the same
 * shiki themes as the viewer and follows the resolved page theme.
 */
export function CodeEditor({ id, value, onChange, language, placeholder, ariaLabel, editorClassName }: CodeEditorProps) {
  const { resolvedTheme } = useTheme()
  const containerRef = useRef<HTMLDivElement>(null)
  const monacoRef = useRef<MonacoNamespace | null>(null)
  const editorRef = useRef<ReturnType<MonacoNamespace['editor']['create']> | null>(null)
  const onChangeRef = useRef(onChange)
  const [ready, setReady] = useState(false)

  const effectiveTheme = resolvedTheme === 'dark' ? 'github-dark-default' : 'github-light-default'

  onChangeRef.current = onChange

  // create the editor once on mount
  useEffect(() => {
    let disposed = false

    loadMonaco().then((monaco) => {
      if (disposed || !containerRef.current) {
        return
      }
      const editor = monaco.editor.create(containerRef.current, {
        value,
        language,
        automaticLayout: true,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        scrollBeyondLastLine: false,
        renderLineHighlight: 'none',
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        stickyScroll: { enabled: false },
        minimap: { enabled: false },
        scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        padding: { top: 8, bottom: 8 },
      })
      editor.onDidChangeModelContent(() => {
        onChangeRef.current(editor.getModel()?.getValue() ?? '')
      })

      editorRef.current = editor
      monacoRef.current = monaco
      setReady(true)
    })

    return () => {
      disposed = true
      editorRef.current?.dispose()
      editorRef.current = null
      monacoRef.current = null
    }
  }, [])

  // keep the model in sync with external value changes
  useEffect(() => {
    const model = editorRef.current?.getModel()
    if (model && model.getValue() !== value) {
      model.setValue(value)
    }
  }, [value])

  // switch grammar when the language changes
  useEffect(() => {
    const monaco = monacoRef.current
    const model = editorRef.current?.getModel()
    if (!monaco || !model) {
      return
    }
    try {
      monaco.editor.setModelLanguage(model, language)
    }
    catch {
      try {
        monaco.editor.setModelLanguage(model, 'plaintext')
      }
      catch {
        // grammar unavailable; ignore
      }
    }
  }, [language])

  // follow the page theme
  useEffect(() => {
    if (!ready) {
      return
    }
    monacoRef.current?.editor.setTheme(effectiveTheme)
  }, [ready, effectiveTheme])

  return (
    <div className="border-input relative min-h-64 w-full overflow-hidden rounded-md border shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-ring/50">
      <div
        ref={containerRef}
        id={id}
        role="textbox"
        aria-multiline="true"
        aria-label={ariaLabel}
        className={cn('h-64 w-full', editorClassName)}
      />
      {!ready && (
        <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-start p-3 font-mono text-sm">
          {placeholder}
        </div>
      )}
    </div>
  )
}
