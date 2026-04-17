// Avatar grande del alumno con foto o iniciales
export default function AvatarAlumno({ alumno, size = 'md', className = '' }) {
  const sizes = {
    sm:  'w-10 h-10 text-sm rounded-xl',
    md:  'w-16 h-16 text-xl rounded-2xl',
    lg:  'w-24 h-24 text-3xl rounded-3xl',
    xl:  'w-32 h-32 text-4xl rounded-3xl',
  };

  const colores = [
    'bg-hs-red-light',
    'bg-hs-yellow-light',
    'bg-hs-green-light',
    'bg-hs-purple-light',
  ];

  const iniciales = alumno?.nombre_completo
    ? alumno.nombre_completo.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
    : '??';

  const colorIdx = alumno?.nombre_completo
    ? alumno.nombre_completo.charCodeAt(0) % 4
    : 0;

  const sizeClass = sizes[size] || sizes.md;

  if (alumno?.foto_url) {
    return (
      <img
        src={alumno.foto_url}
        alt={alumno.nombre_completo}
        className={`${sizeClass} object-cover border-4 border-white shadow-md ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} ${colores[colorIdx]} flex items-center justify-center
                  border-4 border-white shadow-md font-black text-white ${className}`}
    >
      {iniciales}
    </div>
  );
}
