import { memo } from 'react'
import Skeleton from '@/components/ui/Skeleton'

function TourCardSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800"
      aria-hidden="true"
    >
      {/* Image */}
      <Skeleton className="aspect-[3/2] w-full" rounded="rounded-none" />

      {/* Body */}
      <div className="space-y-2.5 p-4">
        <Skeleton.Line width="w-1/3" />
        <Skeleton.Line width="w-full" />
        <Skeleton.Line width="w-4/5" />
        <Skeleton.Line width="w-2/5" />
        <div className="flex justify-between pt-1">
          <Skeleton.Line width="w-1/4" />
          <Skeleton.Line width="w-1/4" />
        </div>
      </div>
    </div>
  )
}

export default memo(TourCardSkeleton)
