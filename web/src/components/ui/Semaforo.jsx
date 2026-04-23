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

// Indicador para estado de pago — recibe `estado` calculado por backend (verde/amarillo/rojo/suspendido)
export const SemaforoPago = ({ estado }) => {
  const textos = { verde: 'Al corriente', amarillo: 'Por vencer', rojo: 'Atrasado', suspendido: 'Suspendido' };
  const estados = { suspendido: 'gris', rojo: 'rojo', amarillo: 'amarillo', verde: 'verde' };
  return <SemaforoBadge estado={estados[estado] || 'gris'} texto={textos[estado] || 'Sin info'} />;
};

// Indicador para documentación
export const SemaforoDocumentacion = ({ completa }) => (
  completa
    ? <SemaforoBadge estado="verde" texto="Completa" />
    : <SemaforoBadge estado="rojo" texto="Documentación Incompleta" />
);
