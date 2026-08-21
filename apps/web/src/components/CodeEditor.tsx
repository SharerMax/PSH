import { useTheme } from 'next-themes'
import { useEffect, useRef, useState } from 'react'
import { codeToHtml } from 'shiki'
import { cn } from '@/lib/utils'

const HIGHLIGHT_DEBOUNCE_MS = 200
const MAX_HIGHLIGHT_LENGTH = 50_000

interface CodeEditorProps {
  id?: string
  value: string
  onChange: (value: string) => void
  language: string
  placeholder?: string
  ariaLabel?: string
}

/**
 * A textarea with live shiki highlighting rendered behind it.
 * The textarea text becomes transparent while highlighted; the caret,
 * selection and IME behaviour stay fully native.
 */
export function CodeEditor({ id, value, onChange, language, placeholder, ariaLabel }: CodeEditorProps) {
  const { resolvedTheme } = useTheme()
  const [highlightedHtml, setHighlightedHtml] = useState('')
  const backdropRef = useRef<HTMLDivElement>(null)

  const theme = resolvedTheme === 'dark' ? 'github-dark-default' : 'github-light-default'
  const highlightable = value.length > 0 && value.length <= MAX_HIGHLIGHT_LENGTH

  useEffect(() => {
    if (!highlightable) {
      setHighlightedHtml('')
      return
    }
    let cancelled = false
    const timer = setTimeout(() => {
      async function run(): Promise<string> {
        try {
          return await codeToHtml(value, { lang: language, theme })
        }
        catch {
          try {
            return await codeToHtml(value, { lang: 'plaintext', theme })
          }
          catch {
            return ''
          }
        }
      }

      run().then((html) => {
        if (!cancelled && html) {
          setHighlightedHtml(html)
        }
      })
    }, HIGHLIGHT_DEBOUNCE_MS)
    return () => {
      clearTimeout(timer)
      cancelled = true
    }
  }, [value, language, theme, highlightable])

  function syncBackdropScroll(event: React.UIEvent<HTMLTextAreaElement>) {
    const backdrop = backdropRef.current
    if (backdrop) {
      backdrop.scrollTop = event.currentTarget.scrollTop
      backdrop.scrollLeft = event.currentTarget.scrollLeft
    }
  }

  const sharedMetrics = 'w-full px-2.5 py-2 font-mono text-base whitespace-pre-wrap break-words md:text-sm'

  return (
    <div className="relative">
      <div
        ref={backdropRef}
        aria-hidden="true"
        className={cn(
          'border-input pointer-events-none absolute inset-0 overflow-hidden rounded-md',
          sharedMetrics,
        )}
      >
        {value === ''
          ? placeholder
            ? <span className="text-muted-foreground">{placeholder}</span>
            : null
          : highlightedHtml
            ? (
                <div
                  className="[&_code]:whitespace-pre-wrap! [&_pre]:m-0! [&_pre]:bg-transparent! [&_pre]:p-0! [&_pre]:whitespace-pre-wrap!"
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              )
            : null}
      </div>

      <textarea
        id={id}
        aria-label={ariaLabel}
        value={value}
        onChange={e => onChange(e.target.value)}
        onScroll={syncBackdropScroll}
        spellCheck={false}
        className={cn(
          'min-h-64 shadow-xs transition-[color,box-shadow] outline-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 relative w-full resize-y rounded-md border',
          'disabled:cursor-not-allowed disabled:opacity-50',
          sharedMetrics,
          'dark:bg-transparent!',
          highlightedHtml
            ? 'selection:bg-primary/30 caret-foreground text-transparent!'
            : 'placeholder:text-muted-foreground',
        )}
      />
    </div>
  )
}
