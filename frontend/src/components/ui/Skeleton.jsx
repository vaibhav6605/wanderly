function Skeleton({ className = '', rounded = 'rounded-lg', ...props }) {
  return (
    <div
      aria-hidden="true"
      className={`skeleton-shimmer ${rounded} ${className}`}
      {...props}
    />
  )
}

Skeleton.Line = function SkeletonLine({ className = '', width = 'w-full' }) {
  return <Skeleton className={`h-4 ${width} ${className}`} rounded="rounded-md" />
}

Skeleton.Circle = function SkeletonCircle({ size = 'h-10 w-10' }) {
  return <Skeleton className={size} rounded="rounded-full" />
}

Skeleton.Rect = function SkeletonRect({ className = '' }) {
  return <Skeleton className={className} />
}

export default Skeleton
