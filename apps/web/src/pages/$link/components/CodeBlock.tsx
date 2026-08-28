import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { codeToHtml } from 'shiki'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useI18n } from '@/lib/i18n'

type CodeThemeChoice = 'auto' | 'light' | 'dark'

const CODE_THEME_OPTIONS: Array<{
  value: CodeThemeChoice
  labelKey: 'code.theme.auto' | 'code.theme.light' | 'code.theme.dark'
  icon: typeof MonitorIcon
}> = [
  { value: 'auto', labelKey: 'code.theme.auto', icon: MonitorIcon },
  { value: 'light', labelKey: 'code.theme.light', icon: SunIcon },
  { value: 'dark', labelKey: 'code.theme.dark', icon: MoonIcon },
]

async function highlight(code: string, language: string, theme: string): Promise<string> {
  try {
    return await codeToHtml(code, { lang: language, theme })
  }
  catch {
    try {
      return await codeToHtml(code, { lang: 'plaintext', theme })
    }
    catch {
      return ''
    }
  }
}

interface CodeBlockProps {
  content: string
  language: string
}

export function CodeBlock({ content, language }: CodeBlockProps) {
  const { t } = useI18n()
  const { resolvedTheme } = useTheme()

  const [choice, setChoice] = useState<CodeThemeChoice>('auto')
  const [highlightedHtml, setHighlightedHtml] = useState('')

  // 'auto' follows the page theme; otherwise the explicit choice wins
  const effectiveTheme
    = (choice === 'auto' ? resolvedTheme ?? 'light' : choice) === 'dark'
      ? 'github-dark-default'
      : 'github-light-default'

  useEffect(() => {
    let cancelled = false
    highlight(content, language, effectiveTheme).then((html) => {
      if (!cancelled) {
        setHighlightedHtml(html)
      }
    })
    return () => {
      cancelled = true
    }
  }, [content, language, effectiveTheme])

  return (
    <div className="relative">
      <div className="bg-background/80 border-border/60 absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-md border p-0.5 backdrop-blur-sm">
        {CODE_THEME_OPTIONS.map(({ value, labelKey, icon: Icon }) => (
          <Button
            key={value}
            size="icon-xs"
            variant={choice === value ? 'secondary' : 'ghost'}
            aria-label={t(labelKey)}
            title={t(labelKey)}
            onClick={() => setChoice(value)}
          >
            <Icon />
          </Button>
        ))}
      </div>

      {highlightedHtml
        ? (
            <Card className="overflow-hidden p-0">
              <CardContent className="p-0">
                <div
                  className="[&_pre]:m-0 [&_pre]:overflow-x-auto [&_pre]:rounded-none [&_pre]:p-4 [&_pre]:text-sm [&_pre]:leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              </CardContent>
            </Card>
          )
        : (
            <Card className="p-0">
              <CardContent className="p-0">
                <pre className="bg-card overflow-x-auto p-4 font-mono text-sm leading-relaxed">{content}</pre>
              </CardContent>
            </Card>
          )}
    </div>
  )
}
