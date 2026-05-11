-- Migración 052: Plantillas WhatsApp — estado final
-- Lista requerida (12 plantillas activas):
--   retardo, sin_recoger, persona_no_autorizada, salida_anticipada
--   alerta_salud, medicamento, incidente, recordatorio_pago
--   sin_comida, fiebre, recargo, pago_comida_lunes
--
-- Acciones:
--   1. Eliminar: no_entrada, suspension (no tienen flujo)
--   2. Actualizar texto sin_recoger (agregar aviso de recargo)
--   3. Insertar: fiebre, sin_comida (nuevas)
--   4. Asegurar activas las 12 finales

-- 1. Eliminar plantillas sin flujo
DELETE FROM plantillas_whatsapp WHERE clave IN ('no_entrada', 'suspension');

-- 2. Actualizar sin_recoger con aviso de recargo
UPDATE plantillas_whatsapp
SET plantilla = '⏰ Hola {{nombre_padre}}, son las {{hora}} y {{nombre_alumno}} aún no ha sido recogido. Su horario de salida fue {{hora_salida}}. Por favor comunícate a la brevedad. De no ser recogido en los próximos minutos se aplicará el cobro de extensión correspondiente. — Happy School'
WHERE clave = 'sin_recoger';

-- 3. Insertar fiebre (si no existe)
INSERT INTO plantillas_whatsapp (clave, nombre, plantilla, activa)
VALUES (
  'fiebre',
  'Alerta de fiebre',
  '🌡️ Hola {{nombre_padre}}, te informamos que {{nombre_alumno}} presentó fiebre hoy ({{temperatura}}°C). Te recomendamos pasar por él/ella a la brevedad. — Happy School',
  true
)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla = EXCLUDED.plantilla,
  activa = true;

-- 4. Insertar sin_comida (si no existe)
INSERT INTO plantillas_whatsapp (clave, nombre, plantilla, activa)
VALUES (
  'sin_comida',
  'Alumno sin servicio de comida',
  '🍽️ Hola {{nombre_padre}}, te recordamos que {{nombre_alumno}} no tiene registrado el servicio de comida para hoy. Si deseas incluirlo, comunícate con la escuela. — Happy School',
  true
)
ON CONFLICT (clave) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  plantilla = EXCLUDED.plantilla,
  activa = true;

-- 5. Asegurar que las 12 plantillas requeridas están activas
UPDATE plantillas_whatsapp
SET activa = true
WHERE clave IN (
  'retardo', 'sin_recoger', 'persona_no_autorizada', 'salida_anticipada',
  'alerta_salud', 'medicamento', 'incidente', 'recordatorio_pago',
  'sin_comida', 'fiebre', 'recargo', 'pago_comida_lunes'
);

-- 6. Desactivar cualquier otra plantilla que quede (limpieza defensiva)
UPDATE plantillas_whatsapp
SET activa = false
WHERE clave NOT IN (
  'retardo', 'sin_recoger', 'persona_no_autorizada', 'salida_anticipada',
  'alerta_salud', 'medicamento', 'incidente', 'recordatorio_pago',
  'sin_comida', 'fiebre', 'recargo', 'pago_comida_lunes'
);
