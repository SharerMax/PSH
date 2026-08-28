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
  'field.customLink': 'Custom link',
  'field.password': 'Password',
  'field.burnAfterRead': 'Burn after read',
  'placeholder.untitled': 'Untitled',
  'placeholder.content': 'Paste your text here…',
  'placeholder.customLink': 'Leave empty to auto-generate (4–32 characters)',
  'placeholder.password': 'Leave empty for no password',
  'description.burnAfterRead': 'Delete the paste immediately after it is read once.',
  'action.create': 'Create paste',
  'action.creating': 'Creating…',
  'action.unlock': 'Unlock',
  'action.unlocking': 'Unlocking…',
  'action.createNew': 'Create a new paste',
  'action.backToPsh': 'Back to psh',
  'action.raw': 'Raw',
  'action.viewPaste': 'View paste',
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
  'error.customLinkInvalid': 'Custom link must be 4–32 characters (letters, digits, dots, dashes, underscores)',
  'error.customLinkTaken': 'This custom link is already taken',
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
  'nav.login': 'Log in',
  'nav.logout': 'Log out',
  'nav.myPastes': 'My pastes',
  'theme.title': 'Theme',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'theme.system': 'System',
  'login.title': 'Log in',
  'login.description': 'Log in to manage your pastes and view access statistics.',
  'login.registerTitle': 'Create account',
  'login.registerDescription': 'Registration is optional — anonymous pasting always works.',
  'field.username': 'Username',
  'placeholder.username': 'Letters, digits, dots, dashes',
  'placeholder.accountPassword': 'At least 8 characters',
  'action.login': 'Log in',
  'action.loggingIn': 'Logging in…',
  'action.register': 'Register',
  'action.switchToRegister': 'No account? Register',
  'action.switchToLogin': 'Already have an account? Log in',
  'toast.loginSuccess': 'Welcome back',
  'toast.registerSuccess': 'Account created',
  'toast.logoutSuccess': 'Logged out',
  'error.authFailed': 'Authentication failed',
  'mine.title': 'My pastes',
  'mine.description': 'Pastes you created while logged in, with access statistics.',
  'mine.empty': 'No pastes yet — create one from the home page.',
  'mine.views': '{count} views',
  'mine.neverViewed': 'Never viewed',
  'mine.lastViewed': 'Last viewed {time}',
  'mine.manage': 'Manage',
  'manage.title': 'Manage paste',
  'stats.title': 'Access statistics',
  'stats.totalViews': 'Total views',
  'stats.lastViewed': 'Last viewed',
  'stats.lastIp': 'Last access IP',
  'stats.byCountry': 'By country / region',
  'stats.records': 'Access records',
  'stats.noData': 'No access data yet.',
  'stats.link': 'Paste link',
  'stats.all': 'All',
  'stats.other': 'Others',
  'stats.top5': 'Top 5 countries / regions',
  'stats.geoDisabled': 'Country / region lookup is disabled.',
  'stats.colTime': 'Time',
  'stats.colIp': 'IP',
  'stats.colCountry': 'Country / region',
  'stats.filterCountry': 'Country / region',
  'stats.filterIp': 'IP contains',
  'stats.dateRange': 'Date range',
  'stats.pickRange': 'Pick a date range',
  'stats.mapCredit': 'Map data: svg-maps (CC BY 4.0)',
  'stats.apply': 'Apply',
  'stats.reset': 'Reset',
  'stats.prevPage': 'Previous page',
  'stats.nextPage': 'Next page',
  'edit.title': 'Edit content',
  'edit.description': 'Changes apply within the validity period — the link stays the same.',
  'edit.currentPassword': 'Current paste password',
  'edit.needPassword': 'Enter the paste password to change protected content.',
  'action.save': 'Save changes',
  'action.saving': 'Saving…',
  'action.delete': 'Delete',
  'action.deleting': 'Deleting…',
  'action.cancel': 'Cancel',
  'mine.col.title': 'Title',
  'mine.col.link': 'Link',
  'mine.col.created': 'Created',
  'mine.col.expires': 'Expires',
  'mine.col.views': 'Views',
  'mine.col.actions': 'Actions',
  'dialog.deleteTitle': 'Delete this paste?',
  'dialog.deleteDescription': '"{title}" will be permanently deleted. This action cannot be undone.',
  'toast.pasteDeleted': 'Paste deleted',
  'error.deleteFailed': 'Failed to delete paste',
  'toast.pasteUpdated': 'Paste updated',
  'error.updateFailed': 'Failed to update paste',
} as const

const zh: Record<TranslationKey, string> = {
  'app.tagline': '分享代码片段，支持密码保护、定时过期与阅后即焚。',
  'home.newPaste': '新建粘贴',
  'home.description': '除内容外，其余选项均可选。',
  'field.title': '标题',
  'field.language': '语言',
  'field.content': '内容',
  'field.expiresIn': '有效期',
  'field.customLink': '自定义链接',
  'field.password': '密码',
  'field.burnAfterRead': '阅后即焚',
  'placeholder.untitled': '无标题',
  'placeholder.content': '在此粘贴文本…',
  'placeholder.customLink': '留空自动生成（4–32 个字符）',
  'placeholder.password': '留空表示不设密码',
  'description.burnAfterRead': '被读取一次后立即删除该粘贴。',
  'action.create': '创建粘贴',
  'action.creating': '创建中…',
  'action.unlock': '解锁',
  'action.unlocking': '解锁中…',
  'action.createNew': '再创建一个粘贴',
  'action.backToPsh': '返回 psh',
  'action.raw': '原始文本',
  'action.viewPaste': '查看粘贴',
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
  'error.customLinkInvalid': '自定义链接需 4–32 个字符，可含字母、数字、点、横线、下划线',
  'error.customLinkTaken': '该自定义链接已被占用',
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
  'nav.login': '登录',
  'nav.logout': '退出登录',
  'nav.myPastes': '我的粘贴',
  'theme.title': '主题',
  'theme.light': '浅色',
  'theme.dark': '深色',
  'theme.system': '跟随系统',
  'login.title': '登录',
  'login.description': '登录后可管理自己的粘贴并查看访问统计。',
  'login.registerTitle': '注册账号',
  'login.registerDescription': '注册是可选的——匿名粘贴始终可用。',
  'field.username': '用户名',
  'placeholder.username': '字母、数字、点、横线',
  'placeholder.accountPassword': '至少 8 个字符',
  'action.login': '登录',
  'action.loggingIn': '登录中…',
  'action.register': '注册',
  'action.switchToRegister': '没有账号？注册',
  'action.switchToLogin': '已有账号？登录',
  'toast.loginSuccess': '欢迎回来',
  'toast.registerSuccess': '注册成功',
  'toast.logoutSuccess': '已退出登录',
  'error.authFailed': '认证失败',
  'mine.title': '我的粘贴',
  'mine.description': '登录后创建的粘贴及其访问统计。',
  'mine.empty': '还没有粘贴——去首页创建一个吧。',
  'mine.views': '{count} 次浏览',
  'mine.neverViewed': '尚未被访问',
  'mine.lastViewed': '最近访问于 {time}',
  'mine.manage': '管理',
  'manage.title': '管理粘贴',
  'stats.title': '访问统计',
  'stats.totalViews': '总浏览量',
  'stats.lastViewed': '最近访问',
  'stats.lastIp': '最近访问 IP',
  'stats.byCountry': '国家/地区分布',
  'stats.records': '访问记录',
  'stats.noData': '暂无访问数据。',
  'stats.link': '粘贴链接',
  'stats.all': '全部',
  'stats.other': '其它',
  'stats.top5': '访问次数前 5 的国家/地区',
  'stats.geoDisabled': '未启用国家/地区解析。',
  'stats.colTime': '时间',
  'stats.colIp': 'IP',
  'stats.colCountry': '国家/地区',
  'stats.filterCountry': '国家/地区',
  'stats.filterIp': 'IP 包含',
  'stats.dateRange': '时间范围',
  'stats.pickRange': '选择日期范围',
  'stats.mapCredit': '地图数据：svg-maps（CC BY 4.0）',
  'stats.apply': '应用',
  'stats.reset': '重置',
  'stats.prevPage': '上一页',
  'stats.nextPage': '下一页',
  'edit.title': '编辑内容',
  'edit.description': '在有效期内修改内容，链接保持不变。',
  'edit.currentPassword': '当前粘贴密码',
  'edit.needPassword': '修改受保护的内容需要输入粘贴密码。',
  'action.save': '保存修改',
  'action.saving': '保存中…',
  'action.delete': '删除',
  'action.deleting': '删除中…',
  'action.cancel': '取消',
  'mine.col.title': '标题',
  'mine.col.link': '链接',
  'mine.col.created': '创建时间',
  'mine.col.expires': '过期时间',
  'mine.col.views': '浏览量',
  'mine.col.actions': '操作',
  'dialog.deleteTitle': '删除该粘贴？',
  'dialog.deleteDescription': '将永久删除“{title}”，此操作不可撤销。',
  'toast.pasteDeleted': '删除成功',
  'error.deleteFailed': '删除失败',
  'toast.pasteUpdated': '更新成功',
  'error.updateFailed': '更新失败',
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
