import { memo, useState, useEffect, useRef } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

const DIFFICULTIES = ['easy', 'moderate', 'challenging', 'difficult']

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest first' },
  { value: 'rating',     label: 'Top rated' },
  { value: 'popular',    label: 'Most popular' },
  { value: 'price_asc',  label: 'Price: low → high' },
  { value: 'price_desc', label: 'Price: high → low' },
  { value: 'title',      label: 'Name A–Z' },
]

const DIFFICULTY_COLORS = {
  easy:        'text-emerald-600 dark:text-emerald-400',
  moderate:    'text-amber-600   dark:text-amber-400',
  challenging: 'text-orange-600  dark:text-orange-400',
  difficult:   'text-red-600     dark:text-red-400',
}

const inputClass =
  'w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-ink dark:text-gray-100 placeholder:text-muted dark:placeholder:text-gray-500 outline-none focus:border-brand-500 dark:focus:border-brand-400 focus:ring-2 focus:ring-brand-500/20 transition-colors'

function FilterSection({ title, children }) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink dark:text-gray-300">
        {title}
      </p>
      {children}
    </div>
  )
}

function TourFilters({ categories = [], values = {}, onChange }) {
  const {
    search = '',
    category = '',
    difficulty = [],
    minPrice = '',
    maxPrice = '',
    sort = 'newest',
  } = values

  // Local state for debounced text inputs
  const [localSearch, setLocalSearch] = useState(search)
  const [localMin, setLocalMin] = useState(minPrice)
  const [localMax, setLocalMax] = useState(maxPrice)

  const debouncedSearch = useDebounce(localSearch, 350)
  const debouncedMin = useDebounce(localMin, 600)
  const debouncedMax = useDebounce(localMax, 600)

  // Keep latest values in a ref so effects don't go stale
  const valuesRef = useRef(values)
  useEffect(() => { valuesRef.current = values })
  const onChangeRef = useRef(onChange)
  useEffect(() => { onChangeRef.current = onChange })

  // Sync from parent when filters are cleared or changed externally
  useEffect(() => { setLocalSearch(search) }, [search])
  useEffect(() => { setLocalMin(minPrice) }, [minPrice])
  useEffect(() => { setLocalMax(maxPrice) }, [maxPrice])

  // Commit debounced search
  useEffect(() => {
    if (debouncedSearch === valuesRef.current.search) return
    onChangeRef.current({ ...valuesRef.current, search: debouncedSearch, page: 1 })
  }, [debouncedSearch])

  // Commit debounced price range
  useEffect(() => {
    if (debouncedMin === valuesRef.current.minPrice && debouncedMax === valuesRef.current.maxPrice) return
    onChangeRef.current({ ...valuesRef.current, minPrice: debouncedMin, maxPrice: debouncedMax, page: 1 })
  }, [debouncedMin, debouncedMax])

  function set(key, val) {
    onChange({ ...values, [key]: val, ...(key !== 'page' && { page: 1 }) })
  }

  function toggleDifficulty(d) {
    const next = difficulty.includes(d) ? difficulty.filter((x) => x !== d) : [...difficulty, d]
    set('difficulty', next)
  }

  const hasFilters = search || category || difficulty.length || minPrice || maxPrice

  return (
    <aside className="space-y-6" aria-label="Tour filters">
      {/* Search */}
      <FilterSection title="Search">
        <div className="relative">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Destination, tour name…"
            aria-label="Search tours"
            className={`${inputClass} pl-9`}
          />
        </div>
      </FilterSection>

      {/* Sort */}
      <FilterSection title="Sort by">
        <select
          value={sort}
          onChange={(e) => set('sort', e.target.value)}
          aria-label="Sort tours by"
          className={inputClass}
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </FilterSection>

      {/* Category */}
      {categories.length > 0 && (
        <FilterSection title="Category">
          <select
            value={category}
            onChange={(e) => set('category', e.target.value)}
            aria-label="Filter by category"
            className={inputClass}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </FilterSection>
      )}

      {/* Difficulty */}
      <FilterSection title="Difficulty">
        <div className="space-y-2">
          {DIFFICULTIES.map((d) => {
            const checked = difficulty.includes(d)
            return (
              <label
                key={d}
                className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60"
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleDifficulty(d)}
                    aria-label={`${d} difficulty`}
                    className="peer sr-only"
                  />
                  <div className={`h-4 w-4 rounded border-2 transition-all ${checked ? 'border-brand-500 bg-brand-500' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                    {checked && (
                      <svg className="h-full w-full text-white" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                        <path d="M3 8l3.5 3.5L13 5" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className={`text-sm font-medium capitalize ${checked ? DIFFICULTY_COLORS[d] : 'text-ink dark:text-gray-200'}`}>
                  {d}
                </span>
              </label>
            )
          })}
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title="Price range">
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value)}
            placeholder="Min"
            min={0}
            aria-label="Minimum price"
            className={inputClass}
          />
          <span className="shrink-0 text-xs text-muted dark:text-gray-500">–</span>
          <input
            type="number"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value)}
            placeholder="Max"
            min={0}
            aria-label="Maximum price"
            className={inputClass}
          />
        </div>
      </FilterSection>

      {/* Clear */}
      {hasFilters && (
        <button
          type="button"
          onClick={() => onChange({ page: 1 })}
          className="text-xs font-semibold text-brand-500 hover:text-brand-600 dark:hover:text-brand-400 underline underline-offset-2 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </aside>
  )
}

export default memo(TourFilters)
