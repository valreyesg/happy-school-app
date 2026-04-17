// Indicador de semáforo: verde/amarillo/rojo/gris
export const SemaforoBadge = ({ estado, texto, className = '' }) => {
  const config = {
    verde:    { cls: 'badge-verde',    emoji: '🟢' },
    amarillo: { cls: 'badge-amarillo', emoji: '🟡' },
    rojo:     { cls: 'badge-rojo',     emoji: '🔴' },
    gris:     { cls: 'badge-gris',     emoji: '⛔' },
  };
  const { cls, emoji } = config[estado] || config.gris;
  return (
    <span className={`${cls} ${className}`}>
      {emoji} {texto}
    </span>
  );
};

// Indicador para estado de pago
export const SemaforoPago = ({ diasAtraso, enPeriodo }) => {
  if (diasAtraso > 30) return <SemaforoBadge estado="gris" texto="Suspendido" />;
  if (diasAtraso > 0)  return <SemaforoBadge estado="rojo" texto={`${diasAtraso}d de atraso`} />;
  if (enPeriodo)       return <SemaforoBadge estado="amarillo" texto="En período" />;
  return <SemaforoBadge estado="verde" texto="Al corriente" />;
};

// Indicador para documentación
export const SemaforoDocumentacion = ({ completa }) => (
  completa
    ? <SemaforoBadge estado="verde" texto="Completa" />
    : <SemaforoBadge estado="rojo" texto="Incompleta" />
);
