import { Skeleton } from './skeleton';

export function NotificationSkeleton() {
  return (
    <div className="flex items-start gap-3 p-3 hover:bg-emerald-900/30 transition-colors">
      <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-3 w-12 flex-shrink-0" />
    </div>
  );
}
