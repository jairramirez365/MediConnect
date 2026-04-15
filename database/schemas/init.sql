CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE OR REPLACE FUNCTION actualizar_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS rol (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo VARCHAR(50) NOT NULL UNIQUE,
  nombre VARCHAR(100) NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  correo_electronico VARCHAR(255) NOT NULL UNIQUE,
  telefono VARCHAR(30),
  contrasena_hash VARCHAR(255) NOT NULL,
  rol_codigo VARCHAR(50) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  fecha_ultimo_acceso TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_usuario_rol_codigo
    FOREIGN KEY (rol_codigo) REFERENCES rol (codigo),
  CONSTRAINT chk_usuario_estado
    CHECK (estado IN ('activo', 'pendiente_verificacion', 'bloqueado', 'inactivo', 'eliminado'))
);

CREATE TABLE IF NOT EXISTS perfil_paciente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  tipo_documento VARCHAR(30) NOT NULL,
  numero_documento VARCHAR(30) NOT NULL UNIQUE,
  fecha_nacimiento DATE NOT NULL,
  sexo VARCHAR(20),
  tipo_sangre VARCHAR(10),
  direccion TEXT,
  nombre_contacto_emergencia VARCHAR(150),
  telefono_contacto_emergencia VARCHAR(30),
  autorizo_participacion_comisionista_chat BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_perfil_paciente_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id)
);

CREATE TABLE IF NOT EXISTS perfil_administrador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  nombre_mostrar VARCHAR(150) NOT NULL,
  alcance_permisos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_perfil_administrador_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id)
);

CREATE TABLE IF NOT EXISTS perfil_comisionista (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  tipo_documento VARCHAR(30) NOT NULL,
  numero_documento VARCHAR(30) NOT NULL UNIQUE,
  codigo_referido_principal VARCHAR(50) NOT NULL UNIQUE,
  porcentaje_comision_base NUMERIC(5,2) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_perfil_comisionista_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT chk_perfil_comisionista_estado
    CHECK (estado IN ('activo', 'inactivo', 'bloqueado'))
);

CREATE TABLE IF NOT EXISTS perfil_medico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  nombres VARCHAR(120) NOT NULL,
  apellidos VARCHAR(120) NOT NULL,
  tipo_documento VARCHAR(30) NOT NULL,
  numero_documento VARCHAR(30) NOT NULL UNIQUE,
  numero_registro_medico VARCHAR(50) NOT NULL UNIQUE,
  biografia_profesional TEXT,
  anos_experiencia INTEGER NOT NULL DEFAULT 0,
  valor_consulta NUMERIC(12,2) NOT NULL,
  modalidad_atencion VARCHAR(20) NOT NULL,
  ciudad VARCHAR(120) NOT NULL,
  estado_validacion VARCHAR(50) NOT NULL,
  fue_aprobado_por_administrador BOOLEAN NOT NULL DEFAULT FALSE,
  administrador_aprobador_id UUID,
  fecha_aprobacion TIMESTAMPTZ,
  promedio_calificacion NUMERIC(3,2) NOT NULL DEFAULT 0,
  cantidad_calificaciones INTEGER NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_perfil_medico_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT fk_perfil_medico_administrador_aprobador
    FOREIGN KEY (administrador_aprobador_id) REFERENCES perfil_administrador (id),
  CONSTRAINT chk_perfil_medico_modalidad
    CHECK (modalidad_atencion IN ('virtual', 'presencial', 'hibrida')),
  CONSTRAINT chk_perfil_medico_estado_validacion
    CHECK (estado_validacion IN ('registro_basico', 'pendiente_documentacion', 'documentacion_en_revision', 'activo', 'rechazado', 'suspendido'))
);

CREATE TABLE IF NOT EXISTS especialidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre VARCHAR(120) NOT NULL UNIQUE,
  descripcion TEXT,
  estado VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT chk_especialidad_estado
    CHECK (estado IN ('activa', 'inactiva'))
);

CREATE TABLE IF NOT EXISTS medico_especialidad (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL,
  especialidad_id UUID NOT NULL,
  es_principal BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_medico_especialidad_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id),
  CONSTRAINT fk_medico_especialidad_especialidad
    FOREIGN KEY (especialidad_id) REFERENCES especialidad (id),
  CONSTRAINT uq_medico_especialidad UNIQUE (medico_id, especialidad_id)
);

CREATE TABLE IF NOT EXISTS documento_medico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL,
  tipo_documento VARCHAR(80) NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  url_archivo TEXT NOT NULL,
  estado_revision VARCHAR(30) NOT NULL,
  observacion_revision TEXT,
  administrador_revisor_id UUID,
  fecha_carga TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fecha_revision TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_documento_medico_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id),
  CONSTRAINT fk_documento_medico_administrador
    FOREIGN KEY (administrador_revisor_id) REFERENCES perfil_administrador (id),
  CONSTRAINT chk_documento_medico_estado_revision
    CHECK (estado_revision IN ('cargado', 'en_revision', 'aprobado', 'rechazado'))
);

CREATE TABLE IF NOT EXISTS disponibilidad_medico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medico_id UUID NOT NULL,
  dia_semana SMALLINT NOT NULL,
  hora_inicio TIME NOT NULL,
  hora_fin TIME NOT NULL,
  duracion_bloque_minutos INTEGER NOT NULL,
  zona_horaria VARCHAR(100) NOT NULL,
  esta_activa BOOLEAN NOT NULL DEFAULT TRUE,
  vigente_desde DATE NOT NULL,
  vigente_hasta DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_disponibilidad_medico_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id),
  CONSTRAINT chk_disponibilidad_medico_dia_semana
    CHECK (dia_semana BETWEEN 0 AND 6),
  CONSTRAINT chk_disponibilidad_medico_hora
    CHECK (hora_inicio < hora_fin),
  CONSTRAINT chk_disponibilidad_medico_duracion
    CHECK (duracion_bloque_minutos > 0)
);

CREATE TABLE IF NOT EXISTS codigo_referido (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  codigo VARCHAR(50) NOT NULL UNIQUE,
  tipo_generador VARCHAR(30) NOT NULL,
  esta_activo BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_expiracion TIMESTAMPTZ,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_codigo_referido_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT chk_codigo_referido_tipo_generador
    CHECK (tipo_generador IN ('paciente', 'comisionista'))
);

CREATE TABLE IF NOT EXISTS cita (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  medico_id UUID NOT NULL,
  comisionista_id UUID,
  codigo_referido_id UUID,
  fecha_hora_inicio_programada TIMESTAMPTZ NOT NULL,
  fecha_hora_fin_programada TIMESTAMPTZ NOT NULL,
  zona_horaria VARCHAR(100) NOT NULL,
  motivo_consulta TEXT NOT NULL,
  tipo_consulta VARCHAR(30) NOT NULL,
  canal_atencion VARCHAR(20) NOT NULL,
  estado VARCHAR(50) NOT NULL,
  requiere_comisionista_en_chat BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_limite_cancelacion_sin_multa TIMESTAMPTZ NOT NULL,
  valor_consulta NUMERIC(12,2) NOT NULL,
  valor_multa_cancelacion NUMERIC(12,2) NOT NULL DEFAULT 0,
  motivo_cancelacion TEXT,
  cancelada_por_usuario_id UUID,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_cita_paciente
    FOREIGN KEY (paciente_id) REFERENCES perfil_paciente (id),
  CONSTRAINT fk_cita_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id),
  CONSTRAINT fk_cita_comisionista
    FOREIGN KEY (comisionista_id) REFERENCES perfil_comisionista (id),
  CONSTRAINT fk_cita_codigo_referido
    FOREIGN KEY (codigo_referido_id) REFERENCES codigo_referido (id),
  CONSTRAINT fk_cita_cancelada_por_usuario
    FOREIGN KEY (cancelada_por_usuario_id) REFERENCES usuario (id),
  CONSTRAINT chk_cita_tipo_consulta
    CHECK (tipo_consulta IN ('primera_vez', 'control', 'seguimiento')),
  CONSTRAINT chk_cita_canal_atencion
    CHECK (canal_atencion IN ('virtual', 'presencial')),
  CONSTRAINT chk_cita_estado
    CHECK (estado IN ('pendiente_confirmacion', 'confirmada', 'en_curso', 'completada', 'cancelada_por_paciente', 'cancelada_por_medico', 'reprogramada', 'no_asistio_paciente', 'no_asistio_medico', 'fallida')),
  CONSTRAINT chk_cita_fechas
    CHECK (fecha_hora_inicio_programada < fecha_hora_fin_programada)
);

CREATE TABLE IF NOT EXISTS historia_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL,
  medico_creador_id UUID NOT NULL,
  resumen_general TEXT,
  alergias TEXT,
  condiciones_cronicas TEXT,
  medicamentos_actuales TEXT,
  estado VARCHAR(30) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_historia_clinica_paciente
    FOREIGN KEY (paciente_id) REFERENCES perfil_paciente (id),
  CONSTRAINT fk_historia_clinica_medico_creador
    FOREIGN KEY (medico_creador_id) REFERENCES perfil_medico (id),
  CONSTRAINT chk_historia_clinica_estado
    CHECK (estado IN ('activa', 'archivada'))
);

CREATE TABLE IF NOT EXISTS nota_clinica (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  historia_clinica_id UUID NOT NULL,
  cita_id UUID NOT NULL UNIQUE,
  medico_id UUID NOT NULL,
  subjetivo TEXT,
  objetivo TEXT,
  analisis TEXT,
  plan TEXT,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_nota_clinica_historia
    FOREIGN KEY (historia_clinica_id) REFERENCES historia_clinica (id),
  CONSTRAINT fk_nota_clinica_cita
    FOREIGN KEY (cita_id) REFERENCES cita (id),
  CONSTRAINT fk_nota_clinica_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id)
);

CREATE TABLE IF NOT EXISTS receta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL UNIQUE,
  paciente_id UUID NOT NULL,
  medico_id UUID NOT NULL,
  fecha_emision TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  estado VARCHAR(30) NOT NULL,
  instrucciones_generales TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_receta_cita
    FOREIGN KEY (cita_id) REFERENCES cita (id),
  CONSTRAINT fk_receta_paciente
    FOREIGN KEY (paciente_id) REFERENCES perfil_paciente (id),
  CONSTRAINT fk_receta_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id),
  CONSTRAINT chk_receta_estado
    CHECK (estado IN ('emitida', 'dispensada', 'cancelada'))
);

CREATE TABLE IF NOT EXISTS receta_item (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  receta_id UUID NOT NULL,
  medicamento VARCHAR(255) NOT NULL,
  presentacion VARCHAR(120),
  dosis VARCHAR(120) NOT NULL,
  frecuencia VARCHAR(120) NOT NULL,
  duracion_dias INTEGER NOT NULL,
  indicaciones TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_receta_item_receta
    FOREIGN KEY (receta_id) REFERENCES receta (id),
  CONSTRAINT chk_receta_item_duracion
    CHECK (duracion_dias > 0)
);

CREATE TABLE IF NOT EXISTS pago (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL UNIQUE,
  paciente_id UUID NOT NULL,
  medico_id UUID NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  moneda VARCHAR(10) NOT NULL,
  metodo_pago VARCHAR(50) NOT NULL,
  referencia_pasarela VARCHAR(120),
  estado VARCHAR(30) NOT NULL,
  fecha_pago TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_pago_cita
    FOREIGN KEY (cita_id) REFERENCES cita (id),
  CONSTRAINT fk_pago_paciente
    FOREIGN KEY (paciente_id) REFERENCES perfil_paciente (id),
  CONSTRAINT fk_pago_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id),
  CONSTRAINT chk_pago_estado
    CHECK (estado IN ('pendiente', 'autorizado', 'pagado', 'fallido', 'reembolsado', 'cancelado', 'penalidad_cobrada'))
);

CREATE TABLE IF NOT EXISTS comision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL,
  pago_id UUID NOT NULL,
  usuario_beneficiario_id UUID NOT NULL,
  tipo_beneficiario VARCHAR(30) NOT NULL,
  codigo_referido_id UUID,
  monto_base NUMERIC(12,2) NOT NULL,
  porcentaje_comision NUMERIC(5,2) NOT NULL,
  monto_comision NUMERIC(12,2) NOT NULL,
  estado VARCHAR(30) NOT NULL,
  fecha_calculo TIMESTAMPTZ,
  fecha_liquidacion TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_comision_cita
    FOREIGN KEY (cita_id) REFERENCES cita (id),
  CONSTRAINT fk_comision_pago
    FOREIGN KEY (pago_id) REFERENCES pago (id),
  CONSTRAINT fk_comision_usuario_beneficiario
    FOREIGN KEY (usuario_beneficiario_id) REFERENCES usuario (id),
  CONSTRAINT fk_comision_codigo_referido
    FOREIGN KEY (codigo_referido_id) REFERENCES codigo_referido (id),
  CONSTRAINT chk_comision_tipo_beneficiario
    CHECK (tipo_beneficiario IN ('paciente', 'comisionista')),
  CONSTRAINT chk_comision_estado
    CHECK (estado IN ('pendiente_calculo', 'calculada', 'pendiente_liquidacion', 'liquidada', 'cancelada'))
);

CREATE TABLE IF NOT EXISTS saldo_usuario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE,
  saldo_disponible NUMERIC(12,2) NOT NULL DEFAULT 0,
  saldo_retenido NUMERIC(12,2) NOT NULL DEFAULT 0,
  moneda VARCHAR(10) NOT NULL,
  fecha_actualizacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_saldo_usuario_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id)
);

CREATE TABLE IF NOT EXISTS movimiento_saldo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  saldo_usuario_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  tipo_movimiento VARCHAR(30) NOT NULL,
  origen_movimiento VARCHAR(50) NOT NULL,
  origen_id UUID,
  monto NUMERIC(12,2) NOT NULL,
  descripcion TEXT,
  estado VARCHAR(30) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_movimiento_saldo_saldo
    FOREIGN KEY (saldo_usuario_id) REFERENCES saldo_usuario (id),
  CONSTRAINT fk_movimiento_saldo_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT chk_movimiento_saldo_tipo
    CHECK (tipo_movimiento IN ('credito', 'debito')),
  CONSTRAINT chk_movimiento_saldo_estado
    CHECK (estado IN ('pendiente', 'aplicado', 'anulado'))
);

CREATE TABLE IF NOT EXISTS calificacion_medico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL UNIQUE,
  paciente_id UUID NOT NULL,
  medico_id UUID NOT NULL,
  puntaje INTEGER NOT NULL,
  comentario TEXT,
  estado VARCHAR(30) NOT NULL,
  fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_calificacion_medico_cita
    FOREIGN KEY (cita_id) REFERENCES cita (id),
  CONSTRAINT fk_calificacion_medico_paciente
    FOREIGN KEY (paciente_id) REFERENCES perfil_paciente (id),
  CONSTRAINT fk_calificacion_medico_medico
    FOREIGN KEY (medico_id) REFERENCES perfil_medico (id),
  CONSTRAINT chk_calificacion_medico_puntaje
    CHECK (puntaje BETWEEN 1 AND 5),
  CONSTRAINT chk_calificacion_medico_estado
    CHECK (estado IN ('publicada', 'oculta'))
);

CREATE TABLE IF NOT EXISTS chat_consulta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL UNIQUE,
  estado VARCHAR(30) NOT NULL,
  fecha_apertura TIMESTAMPTZ,
  fecha_cierre TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_chat_consulta_cita
    FOREIGN KEY (cita_id) REFERENCES cita (id),
  CONSTRAINT chk_chat_consulta_estado
    CHECK (estado IN ('abierto', 'cerrado'))
);

CREATE TABLE IF NOT EXISTS participante_chat_consulta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_consulta_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  rol_participante VARCHAR(30) NOT NULL,
  autorizado_por_paciente BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_ingreso TIMESTAMPTZ,
  fecha_salida TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_participante_chat_consulta_chat
    FOREIGN KEY (chat_consulta_id) REFERENCES chat_consulta (id),
  CONSTRAINT fk_participante_chat_consulta_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT uq_participante_chat_consulta UNIQUE (chat_consulta_id, usuario_id),
  CONSTRAINT chk_participante_chat_consulta_rol
    CHECK (rol_participante IN ('medico', 'paciente', 'comisionista'))
);

CREATE TABLE IF NOT EXISTS notificacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  cita_id UUID,
  tipo_notificacion VARCHAR(50) NOT NULL,
  canal VARCHAR(30) NOT NULL,
  mensaje TEXT NOT NULL,
  estado VARCHAR(30) NOT NULL,
  fecha_programada_envio TIMESTAMPTZ NOT NULL,
  fecha_envio TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_notificacion_usuario
    FOREIGN KEY (usuario_id) REFERENCES usuario (id),
  CONSTRAINT fk_notificacion_cita
    FOREIGN KEY (cita_id) REFERENCES cita (id),
  CONSTRAINT chk_notificacion_estado
    CHECK (estado IN ('programada', 'enviada', 'fallida', 'cancelada'))
);

CREATE TABLE IF NOT EXISTS auditoria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_actor_id UUID,
  entidad VARCHAR(120) NOT NULL,
  entidad_id UUID,
  accion VARCHAR(120) NOT NULL,
  valores_anteriores JSONB,
  valores_nuevos JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  CONSTRAINT fk_auditoria_usuario_actor
    FOREIGN KEY (usuario_actor_id) REFERENCES usuario (id)
);

CREATE INDEX IF NOT EXISTS idx_usuario_rol_codigo ON usuario (rol_codigo);
CREATE INDEX IF NOT EXISTS idx_usuario_estado ON usuario (estado);
CREATE INDEX IF NOT EXISTS idx_usuario_fecha_ultimo_acceso ON usuario (fecha_ultimo_acceso);

CREATE INDEX IF NOT EXISTS idx_perfil_paciente_usuario_id ON perfil_paciente (usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfil_paciente_fecha_nacimiento ON perfil_paciente (fecha_nacimiento);

CREATE INDEX IF NOT EXISTS idx_perfil_administrador_usuario_id ON perfil_administrador (usuario_id);

CREATE INDEX IF NOT EXISTS idx_perfil_comisionista_usuario_id ON perfil_comisionista (usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfil_comisionista_estado ON perfil_comisionista (estado);

CREATE INDEX IF NOT EXISTS idx_perfil_medico_usuario_id ON perfil_medico (usuario_id);
CREATE INDEX IF NOT EXISTS idx_perfil_medico_estado_validacion ON perfil_medico (estado_validacion);
CREATE INDEX IF NOT EXISTS idx_perfil_medico_ciudad ON perfil_medico (ciudad);
CREATE INDEX IF NOT EXISTS idx_perfil_medico_modalidad_atencion ON perfil_medico (modalidad_atencion);
CREATE INDEX IF NOT EXISTS idx_perfil_medico_administrador_aprobador_id ON perfil_medico (administrador_aprobador_id);

CREATE INDEX IF NOT EXISTS idx_medico_especialidad_medico_id ON medico_especialidad (medico_id);
CREATE INDEX IF NOT EXISTS idx_medico_especialidad_especialidad_id ON medico_especialidad (especialidad_id);

CREATE INDEX IF NOT EXISTS idx_documento_medico_medico_id ON documento_medico (medico_id);
CREATE INDEX IF NOT EXISTS idx_documento_medico_estado_revision ON documento_medico (estado_revision);
CREATE INDEX IF NOT EXISTS idx_documento_medico_administrador_revisor_id ON documento_medico (administrador_revisor_id);

CREATE INDEX IF NOT EXISTS idx_disponibilidad_medico_medico_id ON disponibilidad_medico (medico_id);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_medico_dia_semana ON disponibilidad_medico (dia_semana);
CREATE INDEX IF NOT EXISTS idx_disponibilidad_medico_vigente_desde ON disponibilidad_medico (vigente_desde);

CREATE INDEX IF NOT EXISTS idx_codigo_referido_usuario_id ON codigo_referido (usuario_id);
CREATE INDEX IF NOT EXISTS idx_codigo_referido_tipo_generador ON codigo_referido (tipo_generador);
CREATE INDEX IF NOT EXISTS idx_codigo_referido_esta_activo ON codigo_referido (esta_activo);

CREATE INDEX IF NOT EXISTS idx_cita_paciente_id ON cita (paciente_id);
CREATE INDEX IF NOT EXISTS idx_cita_medico_id ON cita (medico_id);
CREATE INDEX IF NOT EXISTS idx_cita_comisionista_id ON cita (comisionista_id);
CREATE INDEX IF NOT EXISTS idx_cita_codigo_referido_id ON cita (codigo_referido_id);
CREATE INDEX IF NOT EXISTS idx_cita_cancelada_por_usuario_id ON cita (cancelada_por_usuario_id);
CREATE INDEX IF NOT EXISTS idx_cita_estado ON cita (estado);
CREATE INDEX IF NOT EXISTS idx_cita_fecha_inicio ON cita (fecha_hora_inicio_programada);
CREATE INDEX IF NOT EXISTS idx_cita_medico_fecha_estado ON cita (medico_id, fecha_hora_inicio_programada, estado);
CREATE INDEX IF NOT EXISTS idx_cita_paciente_fecha_estado ON cita (paciente_id, fecha_hora_inicio_programada, estado);

CREATE INDEX IF NOT EXISTS idx_historia_clinica_paciente_id ON historia_clinica (paciente_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_medico_creador_id ON historia_clinica (medico_creador_id);
CREATE INDEX IF NOT EXISTS idx_historia_clinica_estado ON historia_clinica (estado);

CREATE INDEX IF NOT EXISTS idx_nota_clinica_historia_clinica_id ON nota_clinica (historia_clinica_id);
CREATE INDEX IF NOT EXISTS idx_nota_clinica_medico_id ON nota_clinica (medico_id);

CREATE INDEX IF NOT EXISTS idx_receta_paciente_id ON receta (paciente_id);
CREATE INDEX IF NOT EXISTS idx_receta_medico_id ON receta (medico_id);
CREATE INDEX IF NOT EXISTS idx_receta_estado ON receta (estado);

CREATE INDEX IF NOT EXISTS idx_receta_item_receta_id ON receta_item (receta_id);

CREATE INDEX IF NOT EXISTS idx_pago_paciente_id ON pago (paciente_id);
CREATE INDEX IF NOT EXISTS idx_pago_medico_id ON pago (medico_id);
CREATE INDEX IF NOT EXISTS idx_pago_estado ON pago (estado);
CREATE INDEX IF NOT EXISTS idx_pago_fecha_pago ON pago (fecha_pago);

CREATE INDEX IF NOT EXISTS idx_comision_cita_id ON comision (cita_id);
CREATE INDEX IF NOT EXISTS idx_comision_pago_id ON comision (pago_id);
CREATE INDEX IF NOT EXISTS idx_comision_usuario_beneficiario_id ON comision (usuario_beneficiario_id);
CREATE INDEX IF NOT EXISTS idx_comision_codigo_referido_id ON comision (codigo_referido_id);
CREATE INDEX IF NOT EXISTS idx_comision_estado ON comision (estado);

CREATE INDEX IF NOT EXISTS idx_saldo_usuario_usuario_id ON saldo_usuario (usuario_id);

CREATE INDEX IF NOT EXISTS idx_movimiento_saldo_saldo_usuario_id ON movimiento_saldo (saldo_usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_saldo_usuario_id ON movimiento_saldo (usuario_id);
CREATE INDEX IF NOT EXISTS idx_movimiento_saldo_estado ON movimiento_saldo (estado);
CREATE INDEX IF NOT EXISTS idx_movimiento_saldo_fecha_creacion ON movimiento_saldo (fecha_creacion);

CREATE INDEX IF NOT EXISTS idx_calificacion_medico_paciente_id ON calificacion_medico (paciente_id);
CREATE INDEX IF NOT EXISTS idx_calificacion_medico_medico_id ON calificacion_medico (medico_id);
CREATE INDEX IF NOT EXISTS idx_calificacion_medico_estado ON calificacion_medico (estado);

CREATE INDEX IF NOT EXISTS idx_chat_consulta_estado ON chat_consulta (estado);

CREATE INDEX IF NOT EXISTS idx_participante_chat_consulta_chat_id ON participante_chat_consulta (chat_consulta_id);
CREATE INDEX IF NOT EXISTS idx_participante_chat_consulta_usuario_id ON participante_chat_consulta (usuario_id);

CREATE INDEX IF NOT EXISTS idx_notificacion_usuario_id ON notificacion (usuario_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_cita_id ON notificacion (cita_id);
CREATE INDEX IF NOT EXISTS idx_notificacion_estado ON notificacion (estado);
CREATE INDEX IF NOT EXISTS idx_notificacion_fecha_programada_envio ON notificacion (fecha_programada_envio);

CREATE INDEX IF NOT EXISTS idx_auditoria_usuario_actor_id ON auditoria (usuario_actor_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_entidad ON auditoria (entidad);
CREATE INDEX IF NOT EXISTS idx_auditoria_created_at ON auditoria (created_at);

CREATE OR REPLACE TRIGGER trg_rol_updated_at BEFORE UPDATE ON rol FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_usuario_updated_at BEFORE UPDATE ON usuario FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_perfil_paciente_updated_at BEFORE UPDATE ON perfil_paciente FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_perfil_administrador_updated_at BEFORE UPDATE ON perfil_administrador FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_perfil_comisionista_updated_at BEFORE UPDATE ON perfil_comisionista FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_perfil_medico_updated_at BEFORE UPDATE ON perfil_medico FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_especialidad_updated_at BEFORE UPDATE ON especialidad FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_medico_especialidad_updated_at BEFORE UPDATE ON medico_especialidad FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_documento_medico_updated_at BEFORE UPDATE ON documento_medico FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_disponibilidad_medico_updated_at BEFORE UPDATE ON disponibilidad_medico FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_codigo_referido_updated_at BEFORE UPDATE ON codigo_referido FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_cita_updated_at BEFORE UPDATE ON cita FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_historia_clinica_updated_at BEFORE UPDATE ON historia_clinica FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_nota_clinica_updated_at BEFORE UPDATE ON nota_clinica FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_receta_updated_at BEFORE UPDATE ON receta FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_receta_item_updated_at BEFORE UPDATE ON receta_item FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_pago_updated_at BEFORE UPDATE ON pago FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_comision_updated_at BEFORE UPDATE ON comision FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_saldo_usuario_updated_at BEFORE UPDATE ON saldo_usuario FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_movimiento_saldo_updated_at BEFORE UPDATE ON movimiento_saldo FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_calificacion_medico_updated_at BEFORE UPDATE ON calificacion_medico FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_chat_consulta_updated_at BEFORE UPDATE ON chat_consulta FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_participante_chat_consulta_updated_at BEFORE UPDATE ON participante_chat_consulta FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_notificacion_updated_at BEFORE UPDATE ON notificacion FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
CREATE OR REPLACE TRIGGER trg_auditoria_updated_at BEFORE UPDATE ON auditoria FOR EACH ROW EXECUTE FUNCTION actualizar_updated_at();
