import { CopyIcon, DownloadIcon, ExternalLinkIcon } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useI18n } from '@/lib/i18n'

interface ActionBarProps {
  content: string | null
  link: string
}

export function ActionBar({ content, link }: ActionBarProps) {
  const { t } = useI18n()
  const locked = content === null

  async function copyText(text: string, successMessage: string, failureMessage: string) {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(successMessage)
    }
    catch {
      toast.error(failureMessage)
    }
  }

  function handleDownload() {
    if (content === null)
      return
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${link}.txt`
    anchor.click()
    URL.revokeObjectURL(url)
    toast.success(t('toast.downloadStarted'))
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        disabled={locked}
        onClick={() => content !== null && copyText(content, t('toast.copiedContent'), t('error.copyContent'))}
      >
        <CopyIcon data-icon="inline-start" />
        {t('action.copyContent')}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => copyText(window.location.href, t('toast.copiedLink'), t('error.copyLink'))}
      >
        <CopyIcon data-icon="inline-start" />
        {t('action.copyLink')}
      </Button>
      <Button
        size="sm"
        variant="outline"
        nativeButton={false}
        render={<a href={`/raw/link/${link}`} target="_blank" rel="noreferrer" />}
      >
        <ExternalLinkIcon data-icon="inline-start" />
        {t('action.raw')}
      </Button>
      <Button size="sm" variant="outline" disabled={locked} onClick={handleDownload}>
        <DownloadIcon data-icon="inline-start" />
        {t('action.download')}
      </Button>
    </div>
  )
}
