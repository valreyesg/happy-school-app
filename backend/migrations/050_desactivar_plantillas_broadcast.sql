-- Migración 050: Desactivar plantillas de tipo broadcast (uno a muchos)
-- aviso_nuevo  -> va a TODOS los padres de grupos seleccionados
-- evento_nuevo -> va a TODOS los padres cuando se crea un evento en calendario
-- Solo se dejan activas plantillas uno a uno (padre específico de un alumno)

UPDATE plantillas_whatsapp SET activa = false WHERE clave IN ('aviso_nuevo', 'evento_nuevo');
