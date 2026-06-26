/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState, useMemo, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { fetchToursThunk, fetchCategoriesThunk } from '@/features/tours/toursSlice'
import TourCard from '@/components/tours/TourCard'
import TourCardSkeleton from '@/components/tours/TourCardSkeleton'
import TourFilters from '@/components/tours/TourFilters'
import ErrorMessage from '@/components/ui/ErrorMessage'

const fadeIn = {
  hidden:  { opacity: 0, y: 16 },
  visible: (i = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.05, duration: 0.28, ease: 'easeOut' } }),
}

function FilterDrawerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="h-4 w-4" aria-hidden="true">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  )
}

export default function ToursPage() {
  const dispatch = useDispatch()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterOpen, setFilterOpen] = useState(false)

  const { items, meta, listStatus, listError, categories } = useSelector((s) => s.tours)

  const filterValues = useMemo(() => ({
    search:     searchParams.get('search') ?? '',
    category:   searchParams.get('category') ?? '',
    difficulty: searchParams.get('difficulty') ? searchParams.get('difficulty').split(',') : [],
    minPrice:   searchParams.get('minPrice') ?? '',
    maxPrice:   searchParams.get('maxPrice') ?? '',
    sort:       searchParams.get('sort') ?? 'newest',
    page:       Number(searchParams.get('page') ?? 1),
  }), [searchParams])

  const activeFilterCount = [
    filterValues.search,
    filterValues.category,
    filterValues.difficulty.length > 0 ? '1' : '',
    filterValues.minPrice || filterValues.maxPrice ? '1' : '',
  ].filter(Boolean).length

  useEffect(() => { dispatch(fetchCategoriesThunk()) }, [dispatch])

  useEffect(() => {
    const params = {}
    if (filterValues.search)          params.search = filterValues.search
    if (filterValues.category)        params.category = filterValues.category
    if (filterValues.difficulty.length) params.difficulty = filterValues.difficulty.join(',')
    if (filterValues.minPrice)        params.minPrice = filterValues.minPrice
    if (filterValues.maxPrice)        params.maxPrice = filterValues.maxPrice
    if (filterValues.sort)            params.sort = filterValues.sort
    if (filterValues.page > 1)        params.page = filterValues.page
    dispatch(fetchToursThunk(params))
  }, [dispatch, searchParams]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleFilterChange = useCallback((next) => {
    const p = {}
    if (next.search)               p.search = next.search
    if (next.category)             p.category = next.category
    if (next.difficulty?.length)   p.difficulty = next.difficulty.join(',')
    if (next.minPrice)             p.minPrice = String(next.minPrice)
    if (next.maxPrice)             p.maxPrice = String(next.maxPrice)
    if (next.sort && next.sort !== 'newest') p.sort = next.sort
    if (next.page && next.page > 1) p.page = String(next.page)
    setSearchParams(p, { replace: true })
  }, [setSearchParams])

  const isLoading = listStatus === 'loading'

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <div>
            <h1 className="text-xl font-bold text-ink dark:text-gray-100">Explore Tours</h1>
            {!isLoading && meta && (
              <p className="mt-0.5 text-xs text-muted dark:text-gray-400">
                {meta.total ?? items.length} tour{meta.total !== 1 ? 's' : ''} available
              </p>
            )}
          </div>

          {/* Mobile filter toggle */}
          <button
            type="button"
            onClick={() => setFilterOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 py-2 text-sm font-medium text-ink dark:text-gray-200 shadow-xs lg:hidden"
            aria-label="Open filters"
          >
            <FilterDrawerIcon />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* ── Desktop sidebar ─────────────────────────────────────────── */}
          <div className="hidden w-60 shrink-0 lg:block">
            <div className="sticky top-20">
              <TourFilters
                categories={categories}
                values={filterValues}
                onChange={handleFilterChange}
              />
            </div>
          </div>

          {/* ── Results ──────────────────────────────────────────────────── */}
          <div className="min-w-0 flex-1">
            {listStatus === 'failed' && (
              <ErrorMessage message={listError ?? 'Failed to load tours'} className="mb-6" />
            )}

            {isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
              >
                {Array.from({ length: 9 }).map((_, i) => <TourCardSkeleton key={i} />)}
              </motion.div>
            )}

            {!isLoading && listStatus === 'succeeded' && items.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 py-24 text-center"
              >
                <span className="text-5xl" aria-hidden="true">🔍</span>
                <p className="text-base font-semibold text-ink dark:text-gray-200">No tours found</p>
                <p className="text-sm text-muted dark:text-gray-400">Try broadening your search or clearing some filters.</p>
                <button
                  type="button"
                  onClick={() => handleFilterChange({})}
                  className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 px-5 py-2 text-sm font-medium text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Clear all filters
                </button>
              </motion.div>
            )}

            {!isLoading && listStatus === 'succeeded' && items.length > 0 && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
                >
                  {items.map((tour, i) => (
                    <motion.div
                      key={tour._id}
                      custom={i}
                      variants={fadeIn}
                      initial="hidden"
                      animate="visible"
                    >
                      <TourCard tour={tour} />
                    </motion.div>
                  ))}
                </motion.div>

                {meta && meta.totalPages > 1 && (
                  <Pagination
                    meta={meta}
                    onPage={(p) => handleFilterChange({ ...filterValues, page: p })}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile filter drawer ──────────────────────────────────────────── */}
      <AnimatePresence>
        {filterOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFilterOpen(false)}
              className="fixed inset-0 z-40 bg-black/40 lg:hidden"
              aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-80 overflow-y-auto bg-white dark:bg-gray-900 shadow-2xl lg:hidden"
              role="dialog"
              aria-label="Filters"
            >
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-5 py-4">
                <span className="font-semibold text-ink dark:text-gray-100">Filters</span>
                <button
                  type="button"
                  onClick={() => setFilterOpen(false)}
                  aria-label="Close filters"
                  className="rounded-lg p-1.5 text-muted hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className="p-5">
                <TourFilters
                  categories={categories}
                  values={filterValues}
                  onChange={(next) => { handleFilterChange(next); setFilterOpen(false) }}
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Pagination ────────────────────────────────────────────────────────────── */

function Pagination({ meta, onPage }) {
  const { page, totalPages } = meta

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)
  for (let i = start; i <= end; i++) pages.push(i)

  return (
    <nav aria-label="Tour list pagination" className="mt-10 flex items-center justify-center gap-1.5">
      <PageBtn disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </PageBtn>

      {start > 1 && (
        <>
          <PageBtn onClick={() => onPage(1)}>1</PageBtn>
          {start > 2 && <span className="px-1 text-muted dark:text-gray-500 text-sm" aria-hidden="true">…</span>}
        </>
      )}

      {pages.map((p) => (
        <PageBtn key={p} active={p === page} onClick={() => onPage(p)} aria-label={`Page ${p}`} aria-current={p === page ? 'page' : undefined}>
          {p}
        </PageBtn>
      ))}

      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="px-1 text-muted dark:text-gray-500 text-sm" aria-hidden="true">…</span>}
          <PageBtn onClick={() => onPage(totalPages)}>{totalPages}</PageBtn>
        </>
      )}

      <PageBtn disabled={page >= totalPages} onClick={() => onPage(page + 1)} aria-label="Next page">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </PageBtn>
    </nav>
  )
}

function PageBtn({ children, onClick, active, disabled, ...aria }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.93 }}
      className={[
        'flex min-h-[36px] min-w-[36px] items-center justify-center rounded-lg border px-2 text-sm font-medium transition-colors',
        active
          ? 'border-brand-500 bg-brand-500 text-white shadow-sm'
          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-ink dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
        disabled ? 'cursor-not-allowed opacity-40' : '',
      ].join(' ')}
      {...aria}
    >
      {children}
    </motion.button>
  )
}
