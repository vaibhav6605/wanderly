const sizes = {
  sm: 'h-4 w-4 border-2',
  md: 'h-8 w-8 border-2',
  lg: 'h-12 w-12 border-[3px]',
}

export default function Spinner({ size = 'md', fullPage = false, center = false }) {
  const ring = (
    <div
      role="status"
      aria-label="Loading"
      className={`${sizes[size]} animate-spin rounded-full border-gray-200 dark:border-gray-700 border-t-brand-500 dark:border-t-brand-400`}
    />
  )

  if (fullPage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-[#0a0a0a]">
        {ring}
      </div>
    )
  }

  if (center) {
    return <div className="flex items-center justify-center py-20">{ring}</div>
  }

  return ring
}
