import { Skeleton } from './skeleton';

export function ThreadSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 hover:bg-emerald-900/30 transition-colors">
      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-12" />
        </div>
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-5 w-5 rounded-full flex-shrink-0" />
    </div>
  );
}
