import { Skeleton } from './skeleton';

export function PostCardSkeleton() {
  return (
    <div className="bg-emerald-950/50 border border-emerald-800/40 rounded-2xl p-4">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1">
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>

      {/* Content */}
      <div className="mb-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      {/* Media placeholder */}
      <Skeleton className="h-48 w-full rounded-xl mb-4" />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}
