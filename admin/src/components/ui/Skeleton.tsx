export function Skeleton({ height = 16, width = '100%' }: { height?: number; width?: number | string }) {
  return (
    <div
      className="skeleton"
      style={{ height, width }}
      aria-hidden
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="list-stack" style={{ padding: '1rem' }}>
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={42} />
      ))}
    </div>
  );
}
