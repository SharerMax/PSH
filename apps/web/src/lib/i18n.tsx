import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type Locale = 'en' | 'zh'
export type TranslationKey = keyof typeof en

const STORAGE_KEY = 'psh.locale'

const en = {
  'app.tagline': 'Share code snippets with optional passwords, expiry and burn-after-read.',
  'home.newPaste': 'New paste',
  'home.description': 'Everything is optional except the content.',
  'field.title': 'Title',
  'field.language': 'Language',
  'field.content': 'Content',
  'field.expiresIn': 'Expires in',
  'field.password': 'Password',
  'field.burnAfterRead': 'Burn after read',
  'placeholder.untitled': 'Untitled',
  'placeholder.content': 'Paste your text here…',
  'placeholder.password': 'Leave empty for no password',
  'description.burnAfterRead': 'Delete the paste immediately after it is read once.',
  'action.create': 'Create paste',
  'action.creating': 'Creating…',
  'action.unlock': 'Unlock',
  'action.unlocking': 'Unlocking…',
  'action.createNew': 'Create a new paste',
  'action.backToPsh': 'Back to psh',
  'action.raw': 'Raw',
  'action.copyContent': 'Copy content',
  'action.copyLink': 'Copy link',
  'action.download': 'Download',
  'expiry.10min': '10 minutes',
  'expiry.1h': '1 hour',
  'expiry.1d': '1 day',
  'expiry.7d': '7 days',
  'expiry.forever': 'Never',
  'bytes.counter': '{count} / 1,048,576 bytes',
  'badge.passwordProtected': 'Password protected',
  'badge.destroyedAfterRead': 'Destroyed after read',
  'badge.neverExpires': 'Never expires',
  'badge.expired': 'Expired',
  'badge.expiresIn': 'Expires in {time}',
  'view.untitled': 'Untitled paste',
  'view.lockedNotice': 'Content is hidden until you enter the correct password.',
  'view.goneTitle': 'Nothing here',
  'view.goneDescription': 'This paste does not exist, was destroyed after reading, or has expired.',
  'dialog.passwordTitle': 'Password required',
  'dialog.passwordDescription': 'This paste is protected. Enter the password to view its content.',
  'dialog.passwordLabel': 'Password',
  'error.wrongPassword': 'Wrong password',
  'error.contentRequired': 'Content is required',
  'error.contentTooLarge': 'Content exceeds the 1 MB limit',
  'error.createFailed': 'Failed to create paste',
  'error.copyContent': 'Failed to copy content',
  'error.copyLink': 'Failed to copy link',
  'toast.pasteCreated': 'Paste created',
  'toast.unlocked': 'Paste unlocked',
  'toast.copiedContent': 'Content copied to clipboard',
  'toast.copiedLink': 'Link copied to clipboard',
  'toast.downloadStarted': 'Download started',
  'notFound.code': '404',
  'notFound.description': 'This page does not exist.',
  'code.theme.auto': 'Auto',
  'code.theme.light': 'Light code theme',
  'code.theme.dark': 'Dark code theme',
} as const

const zh: Record<TranslationKey, string> = {
  'app.tagline': '分享代码片段，支持密码保护、定时过期与阅后即焚。',
  'home.newPaste': '新建粘贴',
  'home.description': '除内容外，其余选项均可选。',
  'field.title': '标题',
  'field.language': '语言',
  'field.content': '内容',
  'field.expiresIn': '有效期',
  'field.password': '密码',
  'field.burnAfterRead': '阅后即焚',
  'placeholder.untitled': '无标题',
  'placeholder.content': '在此粘贴文本…',
  'placeholder.password': '留空表示不设密码',
  'description.burnAfterRead': '被读取一次后立即删除该粘贴。',
  'action.create': '创建粘贴',
  'action.creating': '创建中…',
  'action.unlock': '解锁',
  'action.unlocking': '解锁中…',
  'action.createNew': '再创建一个粘贴',
  'action.backToPsh': '返回 psh',
  'action.raw': '原始文本',
  'action.copyContent': '复制内容',
  'action.copyLink': '复制链接',
  'action.download': '下载',
  'expiry.10min': '10 分钟',
  'expiry.1h': '1 小时',
  'expiry.1d': '1 天',
  'expiry.7d': '7 天',
  'expiry.forever': '永久',
  'bytes.counter': '{count} / 1,048,576 字节',
  'badge.passwordProtected': '密码保护',
  'badge.destroyedAfterRead': '读取后已销毁',
  'badge.neverExpires': '永不过期',
  'badge.expired': '已过期',
  'badge.expiresIn': '{time}后过期',
  'view.untitled': '无标题粘贴',
  'view.lockedNotice': '输入正确密码后才能查看内容。',
  'view.goneTitle': '这里什么都没有',
  'view.goneDescription': '该粘贴不存在、已被阅读后销毁或已过期。',
  'dialog.passwordTitle': '需要密码',
  'dialog.passwordDescription': '该粘贴受密码保护，请输入密码查看内容。',
  'dialog.passwordLabel': '密码',
  'error.wrongPassword': '密码错误',
  'error.contentRequired': '内容不能为空',
  'error.contentTooLarge': '内容超过 1 MB 限制',
  'error.createFailed': '创建失败',
  'error.copyContent': '复制内容失败',
  'error.copyLink': '复制链接失败',
  'toast.pasteCreated': '粘贴创建成功',
  'toast.unlocked': '解锁成功',
  'toast.copiedContent': '内容已复制到剪贴板',
  'toast.copiedLink': '链接已复制到剪贴板',
  'toast.downloadStarted': '开始下载',
  'notFound.code': '404',
  'notFound.description': '页面不存在。',
  'code.theme.auto': '自动',
  'code.theme.light': '浅色代码主题',
  'code.theme.dark': '深色代码主题',
}

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { en, zh }

function detectLocale(): Locale {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh')
      return saved
  }
  catch {
    // localStorage unavailable
  }
  return navigator.language?.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export function formatDuration(ms: number, locale: Locale): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const days = Math.floor(totalSeconds / 86400)
  const hours = Math.floor((totalSeconds % 86400) / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  const units = locale === 'zh'
    ? { d: '天', h: '小时', m: '分', s: '秒' }
    : { d: 'd', h: 'h', m: 'm', s: 's' }

  if (days > 0)
    return `${days}${units.d} ${hours}${units.h} ${minutes}${units.m}`
  if (hours > 0)
    return `${hours}${units.h} ${minutes}${units.m} ${seconds}${units.s}`
  return `${minutes}${units.m} ${seconds}${units.s}`
}

interface I18nContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(detectLocale)

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    }
    catch {
      // localStorage unavailable
    }
  }, [])

  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) => {
      let text = dictionaries[locale][key]
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value))
        }
      }
      return text
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider')
  }
  return context
}
