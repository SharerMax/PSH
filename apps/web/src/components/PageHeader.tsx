import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { AccountMenu } from '@/components/AccountMenu'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeSwitcher } from '@/components/ThemeSwitcher'

interface PageHeaderProps {
  /** 左侧内容，默认为返回首页的 "psh" 链接 */
  left?: ReactNode
  /** 右侧控件之前的附加内容，如粘贴 id */
  beforeControls?: ReactNode
  /** 是否显示账户头像/登录入口，默认 true */
  showAccount?: boolean
}

export function PageHeader({ left, beforeControls, showAccount = true }: PageHeaderProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4">
      {left === undefined
        ? (
            <Link to="/" className="text-muted-foreground text-sm hover:underline">
              psh
            </Link>
          )
        : left}
      <div className="ml-auto flex items-center gap-2">
        {beforeControls}
        <LanguageSwitcher />
        <ThemeSwitcher />
        {showAccount && <AccountMenu />}
      </div>
    </div>
  )
}
