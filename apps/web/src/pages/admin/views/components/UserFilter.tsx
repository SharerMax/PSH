import { useEffect, useRef, useState } from 'react'
import { Combobox, ComboboxContent, ComboboxEmpty, ComboboxInput, ComboboxItem, ComboboxList } from '@/components/ui/combobox'
import { getAdminUsers } from '@/lib/api'
import { useI18n } from '@/lib/i18n'

/** Async user picker for the admin access records filter. */
export function UserFilter({
  value,
  onChange,
}: {
  value: string | null
  onChange: (user: string | null) => void
}) {
  const { t } = useI18n()
  const [input, setInput] = useState('')
  const [options, setOptions] = useState<string[]>([])
  const seq = useRef(0)

  useEffect(() => {
    const id = ++seq.current
    const timer = setTimeout(() => {
      getAdminUsers({ page: 1, pageSize: 10, q: input || undefined })
        .then((data) => {
          if (seq.current === id) {
            setOptions(data.rows.map(row => row.username))
          }
        })
        .catch(() => {
          if (seq.current === id) {
            setOptions([])
          }
        })
    }, 250)
    return () => clearTimeout(timer)
  }, [input])

  return (
    <Combobox
      items={options}
      filter={null}
      value={value}
      onValueChange={next => onChange(next ?? null)}
      onInputValueChange={setInput}
    >
      <ComboboxInput
        className="w-44"
        placeholder={t('admin.views.filterUser')}
        aria-label={t('admin.views.filterUser')}
        showClear
      />
      <ComboboxContent>
        <ComboboxList>
          {options.map(username => (
            <ComboboxItem key={username} value={username}>
              {username}
            </ComboboxItem>
          ))}
          <ComboboxEmpty>{t('admin.views.noUsers')}</ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
