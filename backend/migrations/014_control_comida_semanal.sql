-- Migración 014: Tabla control_comida_semanal
-- Confirmación y control de pago de servicio de comida semanal

CREATE TABLE control_comida_semanal (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  alumno_id UUID NOT NULL REFERENCES alumnos(id) ON DELETE CASCADE,
  semana_inicio DATE NOT NULL,
  confirmado BOOLEAN DEFAULT false,
  modalidad VARCHAR(20), -- 'semana_completa' | 'dias_especificos'
  dias_seleccionados INTEGER[], -- [1,2,3,4,5] si dias_especificos, NULL si semana_completa
  monto DECIMAL(10,2),
  metodo_pago VARCHAR(20), -- 'transferencia' | 'efectivo'
  comprobante_pago_url TEXT,
  comprobante_pago_public_id TEXT,
  pago_verificado BOOLEAN DEFAULT false,
  estado VARCHAR(20) DEFAULT 'pendiente', -- pendiente|pagado|cancelado
  notificacion_cancelacion_enviada BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(alumno_id, semana_inicio)
);

CREATE INDEX idx_control_comida_alumno_semana ON control_comida_semanal(alumno_id, semana_inicio);
CREATE INDEX idx_control_comida_estado ON control_comida_semanal(estado);
CREATE INDEX idx_control_comida_confirmado ON control_comida_semanal(confirmado);
