import { cn } from '../lib/utils';

// ── Skeleton primitives ────────────────────────────────────────────

type SkeletonProps = { className?: string };

/** A generic pulsing block — use as building block for custom skeletons */
export function SkeletonBlock({ className, ...rest }: SkeletonProps & Record<string, unknown>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded bg-slate-200',
        className
      )}
      {...rest}
    />
  );
}

// ── Text skeletons ─────────────────────────────────────────────────

/** Single line of skeleton text */
export function SkeletonText({ className }: SkeletonProps) {
  return <SkeletonBlock className={cn('h-4 w-full', className)} />;
}

/** Title-sized skeleton line (shorter width) */
export function SkeletonTitle({ className }: SkeletonProps) {
  return <SkeletonBlock className={cn('h-7 w-48', className)} />;
}

// ── Card skeletons ─────────────────────────────────────────────────

/** A skeleton metric card matching the project's card style */
export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn('bg-white p-6 rounded-xl border border-slate-100 shadow-sm space-y-3', className)}>
      <SkeletonBlock className="h-3 w-20" />
      <SkeletonBlock className="h-8 w-16" />
      <SkeletonBlock className="h-1.5 w-full" />
    </div>
  );
}

// ── Table skeletons ────────────────────────────────────────────────

/** A skeleton table with header + N rows */
export function SkeletonTable({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden', className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-8">
        {Array.from({ length: cols }).map((_, i) => (
          <SkeletonBlock key={i} className="h-3 w-24" />
        ))}
      </div>
      {/* Rows */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="px-6 py-4 flex items-center gap-8">
            {Array.from({ length: cols }).map((_, j) => (
              <SkeletonBlock key={j} className="h-4" style={{ width: `${30 + ((i * cols + j) * 19) % 55}%` }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── List skeletons ─────────────────────────────────────────────────

/** A skeleton activity / log list */
export function SkeletonList({ items = 4, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden', className)}>
      <div className="px-6 py-4 border-b border-slate-100">
        <SkeletonBlock className="h-4 w-32" />
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="p-4 space-y-2">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-4 w-3/4" />
            <SkeletonBlock className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}
