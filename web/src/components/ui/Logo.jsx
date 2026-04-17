export default function Logo({ size = 'md', showSlogan = true, className = '' }) {
  const sizes = {
    sm: { emoji: 'text-2xl', title: 'text-lg', slogan: 'text-xs' },
    md: { emoji: 'text-4xl', title: 'text-2xl', slogan: 'text-sm' },
    lg: { emoji: 'text-6xl', title: 'text-4xl', slogan: 'text-base' },
    xl: { emoji: 'text-8xl', title: 'text-5xl', slogan: 'text-xl' },
  };
  const s = sizes[size] || sizes.md;

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className={s.emoji}>🏫</span>
      <div className="text-center">
        <h1 className={`${s.title} font-black bg-gradient-to-r from-hs-red via-hs-yellow to-hs-purple bg-clip-text text-transparent leading-tight`}>
          Happy School
        </h1>
        {showSlogan && (
          <p className={`${s.slogan} font-bold text-hs-purple/80 tracking-wide`}>
            Comunidad Infantil
          </p>
        )}
      </div>
    </div>
  );
}
