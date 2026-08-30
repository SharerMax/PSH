import type { DateRange } from 'react-day-picker'
import { useState } from 'react'

export interface AppliedListFilters {
  q: string
  language: string
  from: string
  to: string
}

const NO_FILTERS: AppliedListFilters = { q: '', language: 'ALL', from: '', to: '' }

function toISOStringDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Shared filter/pagination state for the "my pastes" / "my favorites" lists. */
export function useMineListFilters() {
  const [qInput, setQInput] = useState('')
  const [language, setLanguage] = useState('ALL')
  const [rangeInput, setRangeInput] = useState<DateRange | undefined>()
  const [applied, setApplied] = useState<AppliedListFilters>(NO_FILTERS)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)

  function handleApply() {
    setApplied({
      q: qInput.trim(),
      language,
      from: rangeInput?.from ? `${toISOStringDate(rangeInput.from)}T00:00:00` : '',
      to: rangeInput?.to ? `${toISOStringDate(rangeInput.to)}T23:59:59` : '',
    })
    setPage(1)
  }

  function handleReset() {
    setQInput('')
    setLanguage('ALL')
    setRangeInput(undefined)
    setApplied(NO_FILTERS)
    setPage(1)
  }

  function handlePageSizeChange(next: number) {
    setPageSize(next)
    setPage(1)
  }

  function hasActiveFilters(appliedFilters: AppliedListFilters): boolean {
    return !!(appliedFilters.q || appliedFilters.from || appliedFilters.to || appliedFilters.language !== 'ALL')
  }

  return {
    qInput,
    setQInput,
    language,
    setLanguage,
    rangeInput,
    setRangeInput,
    applied,
    page,
    setPage,
    pageSize,
    handleApply,
    handleReset,
    handlePageSizeChange,
    hasActiveFilters,
  }
}
