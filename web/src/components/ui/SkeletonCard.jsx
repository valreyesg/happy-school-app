// Skeleton loader para cards de alumnos
export const SkeletonAlumnoCard = () => (
  <div className="card-hs flex items-center gap-4 animate-pulse">
    <div className="skeleton w-16 h-16 rounded-2xl" />
    <div className="flex-1 space-y-2">
      <div className="skeleton h-4 w-3/4 rounded-lg" />
      <div className="skeleton h-3 w-1/2 rounded-lg" />
    </div>
    <div className="skeleton h-6 w-20 rounded-full" />
  </div>
);

// Skeleton para dashboard stat
export const SkeletonStat = () => (
  <div className="card-hs animate-pulse space-y-3">
    <div className="skeleton h-8 w-8 rounded-xl" />
    <div className="skeleton h-8 w-1/2 rounded-lg" />
    <div className="skeleton h-4 w-3/4 rounded-lg" />
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-3">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonAlumnoCard key={i} />
    ))}
  </div>
);
