BEGIN;

ALTER TABLE perfil_paciente
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(120),
  ADD COLUMN IF NOT EXISTS municipio VARCHAR(120);

ALTER TABLE perfil_administrador
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(120),
  ADD COLUMN IF NOT EXISTS municipio VARCHAR(120);

ALTER TABLE perfil_comisionista
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(120),
  ADD COLUMN IF NOT EXISTS municipio VARCHAR(120);

ALTER TABLE perfil_medico
  ADD COLUMN IF NOT EXISTS departamento VARCHAR(120),
  ADD COLUMN IF NOT EXISTS municipio VARCHAR(120);

ALTER TABLE notificacion
  ALTER COLUMN tipo_notificacion TYPE VARCHAR(120);

ALTER TABLE usuario
  ADD COLUMN IF NOT EXISTS correo_verificado_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS telefono_verificado_at TIMESTAMPTZ;

ALTER TABLE notificacion
  ADD COLUMN IF NOT EXISTS tipo_evento VARCHAR(80),
  ADD COLUMN IF NOT EXISTS destinatario VARCHAR(255),
  ADD COLUMN IF NOT EXISTS proveedor VARCHAR(80),
  ADD COLUMN IF NOT EXISTS proveedor_mensaje_id VARCHAR(120),
  ADD COLUMN IF NOT EXISTS intentos_envio INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ultimo_intento_envio TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_entrega TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS fecha_lectura TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS error_envio TEXT,
  ADD COLUMN IF NOT EXISTS payload JSONB,
  ADD COLUMN IF NOT EXISTS metadata JSONB;

CREATE TABLE IF NOT EXISTS verificacion_contacto (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL,
  canal VARCHAR(30) NOT NULL,
  destino VARCHAR(255) NOT NULL,
  codigo_hash VARCHAR(255) NOT NULL,
  token_seguro VARCHAR(120),
  estado VARCHAR(30) NOT NULL DEFAULT 'pendiente',
  intentos_validacion INTEGER NOT NULL DEFAULT 0,
  max_intentos_validacion INTEGER NOT NULL DEFAULT 5,
  intentos_reenvio INTEGER NOT NULL DEFAULT 0,
  max_reenvios INTEGER NOT NULL DEFAULT 5,
  fecha_expiracion TIMESTAMPTZ NOT NULL,
  bloqueado_hasta TIMESTAMPTZ,
  ultimo_envio_at TIMESTAMPTZ,
  verificado_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS conversacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo_conversacion VARCHAR(50) NOT NULL,
  asunto VARCHAR(180),
  estado VARCHAR(30) NOT NULL DEFAULT 'activa',
  contexto_tipo VARCHAR(50),
  contexto_id UUID,
  ultimo_mensaje_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS participante_conversacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id UUID NOT NULL,
  usuario_id UUID NOT NULL,
  rol_usuario VARCHAR(30) NOT NULL,
  ultima_lectura_at TIMESTAMPTZ,
  archivada_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mensaje_conversacion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversacion_id UUID NOT NULL,
  remitente_usuario_id UUID NOT NULL,
  tipo_mensaje VARCHAR(30) NOT NULL DEFAULT 'texto',
  contenido TEXT NOT NULL,
  metadata JSONB,
  estado VARCHAR(30) NOT NULL DEFAULT 'enviado',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS video_consulta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cita_id UUID NOT NULL UNIQUE,
  proveedor VARCHAR(50) NOT NULL,
  proveedor_sala_id VARCHAR(150) NOT NULL,
  url_sala TEXT NOT NULL,
  estado VARCHAR(30) NOT NULL,
  fecha_habilitacion_acceso TIMESTAMPTZ NOT NULL,
  fecha_expiracion_acceso TIMESTAMPTZ NOT NULL,
  fecha_inicio_real TIMESTAMPTZ,
  fecha_fin_real TIMESTAMPTZ,
  url_grabacion TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS mensaje_video_consulta (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_consulta_id UUID NOT NULL,
  remitente_usuario_id UUID NOT NULL,
  rol_remitente VARCHAR(30) NOT NULL,
  tipo_mensaje VARCHAR(30) NOT NULL DEFAULT 'texto',
  contenido TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

ALTER TABLE cita
  ADD COLUMN IF NOT EXISTS fecha_expiracion_pago TIMESTAMPTZ;

ALTER TABLE cita
  DROP CONSTRAINT IF EXISTS chk_cita_estado;

ALTER TABLE cita
  ADD CONSTRAINT chk_cita_estado
    CHECK (estado IN ('pendiente_pago', 'pendiente_confirmacion', 'confirmada', 'en_curso', 'completada', 'cancelada_por_paciente', 'cancelada_por_medico', 'reprogramada', 'no_asistio_paciente', 'no_asistio_medico', 'fallida', 'expirada_por_no_pago'));

UPDATE medico_especialidad
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND especialidad_id IN (
    SELECT id
    FROM especialidad
    WHERE nombre ILIKE 'Especialidad Test %'
  );

UPDATE especialidad
SET deleted_at = NOW(), estado = 'inactiva'
WHERE deleted_at IS NULL
  AND nombre ILIKE 'Especialidad Test %';

UPDATE disponibilidad_medico
SET deleted_at = NOW(), esta_activa = FALSE
WHERE deleted_at IS NULL
  AND medico_id IN (
    SELECT pm.id
    FROM perfil_medico pm
    INNER JOIN usuario u ON u.id = pm.usuario_id
    WHERE u.correo_electronico LIKE 'doctor.%@example.com'
       OR u.correo_electronico LIKE 'onboarding.doctor.%@example.com'
  );

UPDATE documento_medico
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND medico_id IN (
    SELECT pm.id
    FROM perfil_medico pm
    INNER JOIN usuario u ON u.id = pm.usuario_id
    WHERE u.correo_electronico LIKE 'doctor.%@example.com'
       OR u.correo_electronico LIKE 'onboarding.doctor.%@example.com'
  );

UPDATE medico_especialidad
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND medico_id IN (
    SELECT pm.id
    FROM perfil_medico pm
    INNER JOIN usuario u ON u.id = pm.usuario_id
    WHERE u.correo_electronico LIKE 'doctor.%@example.com'
       OR u.correo_electronico LIKE 'onboarding.doctor.%@example.com'
  );

UPDATE perfil_medico
SET deleted_at = NOW(), estado_validacion = 'rechazado'
WHERE deleted_at IS NULL
  AND usuario_id IN (
    SELECT id
    FROM usuario
    WHERE correo_electronico LIKE 'doctor.%@example.com'
       OR correo_electronico LIKE 'onboarding.doctor.%@example.com'
  );

UPDATE usuario
SET deleted_at = NOW(), estado = 'inactivo'
WHERE deleted_at IS NULL
  AND (
    correo_electronico LIKE 'doctor.%@example.com'
    OR correo_electronico LIKE 'onboarding.doctor.%@example.com'
  );

INSERT INTO rol (id, codigo, nombre, descripcion) VALUES
  ('11111111-1111-1111-1111-111111111111', 'administrador', 'Administrador', 'Gestión general de la plataforma'),
  ('22222222-2222-2222-2222-222222222222', 'medico', 'Médico', 'Prestador de servicios de salud'),
  ('33333333-3333-3333-3333-333333333333', 'paciente', 'Paciente', 'Usuario final de atención'),
  ('44444444-4444-4444-4444-444444444444', 'comisionista', 'Comisionista', 'Agente de servicio y referidos')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO usuario (id, correo_electronico, telefono, contrasena_hash, rol_codigo, estado, fecha_ultimo_acceso) VALUES
  ('10000000-0000-0000-0000-000000000001', 'admin@mediconnect.local', '+573001110001', 'scrypt$8f45bf7e4675b6477a1d4324d683f6ed$a2a582b0426341aba377f5c85b72421db34b20dc785485e120a7afb06c74b169b5bdfa3add1d0670f2fc113228b667b373d92e37e7161701c3cbcdd67e8060f1', 'administrador', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000002', 'dr.lopez@mediconnect.local', '+573001110002', 'scrypt$6c84b3532a4e87b157c596655c31358a$c5d3474bef9838cc62fe9a688ca3bbe7c64ea29d23a0537b235f62df7672ca4395708bc782b2e5bb386b61deb9040ddb1480a5b64c0bee72b9915d2c03ef8b04', 'medico', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000003', 'dra.gomez@mediconnect.local', '+573001110003', 'scrypt$9d7f2196f00bc5624afa64fe1ebb3f55$33443c2077171dc44b1c5d7356f110ef5daa4add117af0986dc20f91fd035dc8363fd33621d03c80d360868271c3e75b713d50e2a35f73ecb27e9b475efd5cdd', 'medico', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000004', 'dr.pendiente@mediconnect.local', '+573001110004', 'scrypt$8a135118a353937a4aab60cac75189e8$66a6a0b5cfa93dcb3100faa6bf9e46c4dba2ba932427f454fb3dd318d3d913b79f73a743ad3ab1546887039d208284b583d78997dcd97dd77ebb8c6e1cde11fc', 'medico', 'pendiente_verificacion', NOW()),
  ('10000000-0000-0000-0000-000000000005', 'ana.paciente@mediconnect.local', '+573001110005', 'scrypt$018476da63be9a47d5710a1eb49aef86$c3ece3a6731a2db533517b7f7ce8eeb47b7fa9c94872f7eee92a3939a2ca38546b70dab6ab170461e07afa100db77e02aba6766b4fcf4aa4bb5455186c1d511b', 'paciente', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000006', 'carlos.paciente@mediconnect.local', '+573001110006', 'scrypt$0c1a2290500f73d35c8f3b9eb4dfdf4c$3d61a8005b1f8706f80f24579b30e205508a984e55e1b6877aec63d6374e15a08d946e53b889ae284ada4cb271b2ee677cc895766f4b10b591a171831fd237f8', 'paciente', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000007', 'sara.comisionista@mediconnect.local', '+573001110007', 'scrypt$35fda9837aca5197491eab131dc889d8$4a119bd93f02576ad836277fc3cb2fb44227d953bec57fc7b66a706ec54215d124aaa5c5d0b2c10a70b27f64a71f67cea66197f715c415caa1e5b78c231fbb78', 'comisionista', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000008', 'luisa.paciente@mediconnect.local', '+573001110008', 'scrypt$89d2d1b5e99e6f8054c03a3b59bd2670$56c8ff99e296e2136fb0ae57e71b3a5ab11e574a567e1e3bc493dcc7d493192acc4de654fb6fbed8a4425e5967666f0a409d85494a71ecf58f1e2867616afdef', 'paciente', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000009', 'dra.ruiz@mediconnect.local', '+573001110009', 'scrypt$b2be9ef31a580b52cf3760d6bc06a5f8$8c0fe3764c5673bf2d2f21022e37be61f4fb7c7fc8b6682c8b4a291869fe75e82f31169dcf315fa6d6d1a2aeb72f6e4ba7d3c545554cae9b0f6b2d680d8437e4', 'medico', 'activo', NOW()),
  ('10000000-0000-0000-0000-000000000010', 'dr.castro@mediconnect.local', '+573001110010', 'scrypt$d4883133284b12ad61e27979f1eb99e0$96c6f44d2f16d6fe2e2b6441d9bfb87e36031c1478f8b38b0e81ee4e8d2f11af03770e23be14f4918658b6d2c1e5db7682eb31cb762e9cf2f7da18d6b9fae24f', 'medico', 'activo', NOW())
ON CONFLICT (correo_electronico) DO NOTHING;

UPDATE usuario SET contrasena_hash = 'scrypt$8f45bf7e4675b6477a1d4324d683f6ed$a2a582b0426341aba377f5c85b72421db34b20dc785485e120a7afb06c74b169b5bdfa3add1d0670f2fc113228b667b373d92e37e7161701c3cbcdd67e8060f1' WHERE correo_electronico = 'admin@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$6c84b3532a4e87b157c596655c31358a$c5d3474bef9838cc62fe9a688ca3bbe7c64ea29d23a0537b235f62df7672ca4395708bc782b2e5bb386b61deb9040ddb1480a5b64c0bee72b9915d2c03ef8b04' WHERE correo_electronico = 'dr.lopez@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$9d7f2196f00bc5624afa64fe1ebb3f55$33443c2077171dc44b1c5d7356f110ef5daa4add117af0986dc20f91fd035dc8363fd33621d03c80d360868271c3e75b713d50e2a35f73ecb27e9b475efd5cdd' WHERE correo_electronico = 'dra.gomez@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$8a135118a353937a4aab60cac75189e8$66a6a0b5cfa93dcb3100faa6bf9e46c4dba2ba932427f454fb3dd318d3d913b79f73a743ad3ab1546887039d208284b583d78997dcd97dd77ebb8c6e1cde11fc' WHERE correo_electronico = 'dr.pendiente@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$018476da63be9a47d5710a1eb49aef86$c3ece3a6731a2db533517b7f7ce8eeb47b7fa9c94872f7eee92a3939a2ca38546b70dab6ab170461e07afa100db77e02aba6766b4fcf4aa4bb5455186c1d511b' WHERE correo_electronico = 'ana.paciente@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$0c1a2290500f73d35c8f3b9eb4dfdf4c$3d61a8005b1f8706f80f24579b30e205508a984e55e1b6877aec63d6374e15a08d946e53b889ae284ada4cb271b2ee677cc895766f4b10b591a171831fd237f8' WHERE correo_electronico = 'carlos.paciente@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$35fda9837aca5197491eab131dc889d8$4a119bd93f02576ad836277fc3cb2fb44227d953bec57fc7b66a706ec54215d124aaa5c5d0b2c10a70b27f64a71f67cea66197f715c415caa1e5b78c231fbb78' WHERE correo_electronico = 'sara.comisionista@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$89d2d1b5e99e6f8054c03a3b59bd2670$56c8ff99e296e2136fb0ae57e71b3a5ab11e574a567e1e3bc493dcc7d493192acc4de654fb6fbed8a4425e5967666f0a409d85494a71ecf58f1e2867616afdef' WHERE correo_electronico = 'luisa.paciente@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$b2be9ef31a580b52cf3760d6bc06a5f8$8c0fe3764c5673bf2d2f21022e37be61f4fb7c7fc8b6682c8b4a291869fe75e82f31169dcf315fa6d6d1a2aeb72f6e4ba7d3c545554cae9b0f6b2d680d8437e4' WHERE correo_electronico = 'dra.ruiz@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$d4883133284b12ad61e27979f1eb99e0$96c6f44d2f16d6fe2e2b6441d9bfb87e36031c1478f8b38b0e81ee4e8d2f11af03770e23be14f4918658b6d2c1e5db7682eb31cb762e9cf2f7da18d6b9fae24f' WHERE correo_electronico = 'dr.castro@mediconnect.local';

UPDATE usuario
SET correo_verificado_at = COALESCE(correo_verificado_at, NOW() - INTERVAL '30 days'),
    telefono_verificado_at = COALESCE(telefono_verificado_at, NOW() - INTERVAL '30 days')
WHERE correo_electronico IN (
  'admin@mediconnect.local',
  'dr.lopez@mediconnect.local',
  'dra.gomez@mediconnect.local',
  'dr.pendiente@mediconnect.local',
  'ana.paciente@mediconnect.local',
  'carlos.paciente@mediconnect.local',
  'sara.comisionista@mediconnect.local',
  'luisa.paciente@mediconnect.local',
  'dra.ruiz@mediconnect.local',
  'dr.castro@mediconnect.local'
);

INSERT INTO perfil_administrador (id, usuario_id, nombre_mostrar, departamento, municipio, alcance_permisos) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Admin Principal', 'Bogota, D.C.', 'Bogota, D.C.', '{"medicos": "approve", "usuarios": "full", "citas": "full"}')
ON CONFLICT (usuario_id) DO NOTHING;

UPDATE perfil_administrador
SET departamento = 'Bogota, D.C.',
    municipio = 'Bogota, D.C.'
WHERE usuario_id = '10000000-0000-0000-0000-000000000001';

INSERT INTO perfil_paciente (
  id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, sexo, tipo_sangre,
  direccion, nombre_contacto_emergencia, telefono_contacto_emergencia, autorizo_participacion_comisionista_chat
) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Ana María', 'Ramírez', 'CC', '1001001001', '1992-02-10', 'femenino', 'O+', 'Bogotá, Colombia', 'Marta Ramírez', '+573101001001', TRUE),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'Carlos Andrés', 'Pérez', 'CC', '1001001002', '1987-07-20', 'masculino', 'A+', 'Medellín, Colombia', 'Laura Pérez', '+573101001002', FALSE),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 'Luisa Fernanda', 'Torres', 'CC', '1001001003', '1998-11-15', 'femenino', 'B+', 'Cali, Colombia', 'Julio Torres', '+573101001003', TRUE)
ON CONFLICT (usuario_id) DO NOTHING;

UPDATE perfil_paciente
SET departamento = CASE usuario_id
      WHEN '10000000-0000-0000-0000-000000000005' THEN 'Bogota, D.C.'
      WHEN '10000000-0000-0000-0000-000000000006' THEN 'Antioquia'
      WHEN '10000000-0000-0000-0000-000000000008' THEN 'Valle del Cauca'
      ELSE departamento
    END,
    municipio = CASE usuario_id
      WHEN '10000000-0000-0000-0000-000000000005' THEN 'Bogota, D.C.'
      WHEN '10000000-0000-0000-0000-000000000006' THEN 'Medellin'
      WHEN '10000000-0000-0000-0000-000000000008' THEN 'Cali'
      ELSE municipio
    END
WHERE usuario_id IN (
  '10000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000008'
);

INSERT INTO perfil_comisionista (
  id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, codigo_referido_principal, porcentaje_comision_base, estado
) VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 'Sara', 'Mendoza', 'CC', '2002002001', 'SARA-SALUD-01', 12.50, 'activo')
ON CONFLICT (usuario_id) DO NOTHING;

UPDATE perfil_comisionista
SET departamento = 'Atlantico',
    municipio = 'Barranquilla'
WHERE usuario_id = '10000000-0000-0000-0000-000000000007';

INSERT INTO perfil_medico (
  id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, numero_registro_medico, biografia_profesional,
  anos_experiencia, valor_consulta, modalidad_atencion, ciudad, estado_validacion, fue_aprobado_por_administrador,
  administrador_aprobador_id, fecha_aprobacion, promedio_calificacion, cantidad_calificaciones
) VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Julián', 'López', 'CC', '3003003001', 'RM-10001', 'Internista con enfoque preventivo y acompañamiento continuo del adulto.', 12, 180000, 'virtual', 'Bogotá', 'activo', TRUE, '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days', 4.80, 12),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Valentina', 'Gómez', 'CC', '3003003002', 'RM-10002', 'Pediatra con experiencia en seguimiento integral y orientación familiar.', 9, 160000, 'virtual', 'Medellín', 'activo', TRUE, '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days', 4.60, 8),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Ricardo', 'Navas', 'CC', '3003003003', 'RM-10003', 'Médico general pendiente de validación documental.', 4, 120000, 'presencial', 'Cali', 'documentacion_en_revision', FALSE, NULL, NULL, 0, 0),
  ('50000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000009', 'Paula', 'Ruiz', 'CC', '3003003004', 'RM-10004', 'Dermatóloga enfocada en control preventivo, cuidado de piel y teleorientación especializada.', 7, 145000, 'virtual', 'Bogotá', 'activo', TRUE, '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '45 days', 4.90, 16),
  ('50000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000010', 'Andres', 'Castro', 'CC', '3003003005', 'RM-10005', 'Cardiólogo con experiencia en chequeos preventivos y control de riesgo cardiovascular.', 18, 210000, 'virtual', 'Bucaramanga', 'activo', TRUE, '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '120 days', 4.70, 21)
ON CONFLICT (usuario_id) DO NOTHING;

UPDATE perfil_medico
SET departamento = CASE usuario_id
      WHEN '10000000-0000-0000-0000-000000000002' THEN 'Bogota, D.C.'
      WHEN '10000000-0000-0000-0000-000000000003' THEN 'Antioquia'
      WHEN '10000000-0000-0000-0000-000000000004' THEN 'Valle del Cauca'
      WHEN '10000000-0000-0000-0000-000000000009' THEN 'Bogota, D.C.'
      WHEN '10000000-0000-0000-0000-000000000010' THEN 'Santander'
      ELSE departamento
    END,
    municipio = CASE usuario_id
      WHEN '10000000-0000-0000-0000-000000000002' THEN 'Bogota, D.C.'
      WHEN '10000000-0000-0000-0000-000000000003' THEN 'Medellin'
      WHEN '10000000-0000-0000-0000-000000000004' THEN 'Cali'
      WHEN '10000000-0000-0000-0000-000000000009' THEN 'Bogota, D.C.'
      WHEN '10000000-0000-0000-0000-000000000010' THEN 'Bucaramanga'
      ELSE municipio
    END
WHERE usuario_id IN (
  '10000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000009',
  '10000000-0000-0000-0000-000000000010'
);

INSERT INTO especialidad (id, nombre, descripcion, estado) VALUES
  ('60000000-0000-0000-0000-000000000001', 'Medicina Interna', 'Atención integral del adulto', 'activa'),
  ('60000000-0000-0000-0000-000000000002', 'Pediatría', 'Atención para niños y adolescentes', 'activa'),
  ('60000000-0000-0000-0000-000000000003', 'Medicina General', 'Consulta general primaria', 'activa'),
  ('60000000-0000-0000-0000-000000000004', 'Dermatología', 'Atención de piel, cabello y uñas', 'activa'),
  ('60000000-0000-0000-0000-000000000005', 'Cardiología', 'Consulta cardiovascular preventiva y de control', 'activa'),
  ('60000000-0000-0000-0000-000000000006', 'Ginecología', 'Salud integral femenina y control ginecológico', 'activa'),
  ('60000000-0000-0000-0000-000000000007', 'Obstetricia', 'Seguimiento del embarazo y control prenatal', 'activa'),
  ('60000000-0000-0000-0000-000000000008', 'Neurología', 'Evaluación y manejo de sistema nervioso', 'activa'),
  ('60000000-0000-0000-0000-000000000009', 'Psiquiatría', 'Atención en salud mental y seguimiento especializado', 'activa'),
  ('60000000-0000-0000-0000-000000000010', 'Psicología Clínica', 'Acompañamiento clínico y terapéutico', 'activa'),
  ('60000000-0000-0000-0000-000000000011', 'Endocrinología', 'Control hormonal y metabólico', 'activa'),
  ('60000000-0000-0000-0000-000000000012', 'Gastroenterología', 'Diagnóstico y manejo del sistema digestivo', 'activa'),
  ('60000000-0000-0000-0000-000000000013', 'Neumología', 'Atención respiratoria y control pulmonar', 'activa'),
  ('60000000-0000-0000-0000-000000000014', 'Nefrología', 'Seguimiento renal y manejo especializado', 'activa'),
  ('60000000-0000-0000-0000-000000000015', 'Reumatología', 'Diagnóstico y tratamiento osteomuscular autoinmune', 'activa'),
  ('60000000-0000-0000-0000-000000000016', 'Otorrinolaringología', 'Atención de oído, nariz y garganta', 'activa'),
  ('60000000-0000-0000-0000-000000000017', 'Oftalmología', 'Consulta visual y control ocular', 'activa'),
  ('60000000-0000-0000-0000-000000000018', 'Urología', 'Salud urinaria y reproductiva masculina', 'activa'),
  ('60000000-0000-0000-0000-000000000019', 'Traumatología y Ortopedia', 'Lesiones y control osteoarticular', 'activa'),
  ('60000000-0000-0000-0000-000000000020', 'Nutrición y Dietética', 'Planes nutricionales y acompañamiento alimentario', 'activa'),
  ('60000000-0000-0000-0000-000000000021', 'Medicina Familiar', 'Seguimiento continuo del paciente y su familia', 'activa'),
  ('60000000-0000-0000-0000-000000000022', 'Infectología', 'Diagnóstico y tratamiento de enfermedades infecciosas', 'activa'),
  ('60000000-0000-0000-0000-000000000023', 'Hematología', 'Trastornos sanguíneos y seguimiento especializado', 'activa'),
  ('60000000-0000-0000-0000-000000000024', 'Oncología', 'Atención integral oncológica y seguimiento', 'activa')
ON CONFLICT (id) DO UPDATE
SET nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    estado = EXCLUDED.estado,
    deleted_at = NULL;

INSERT INTO medico_especialidad (id, medico_id, especialidad_id, es_principal) VALUES
  ('61000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', TRUE),
  ('61000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000021', FALSE),
  ('61000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', TRUE),
  ('61000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', TRUE),
  ('61000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000021', FALSE),
  ('61000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000004', TRUE),
  ('61000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000020', FALSE),
  ('61000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000005', TRUE),
  ('61000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000011', FALSE)
ON CONFLICT (id) DO UPDATE
SET medico_id = EXCLUDED.medico_id,
    especialidad_id = EXCLUDED.especialidad_id,
    es_principal = EXCLUDED.es_principal,
    deleted_at = NULL;

UPDATE medico_especialidad
SET deleted_at = NOW()
WHERE deleted_at IS NULL
  AND (
    (medico_id = '50000000-0000-0000-0000-000000000001' AND especialidad_id NOT IN ('60000000-0000-0000-0000-000000000001'))
    OR (medico_id = '50000000-0000-0000-0000-000000000002' AND especialidad_id NOT IN ('60000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000021'))
    OR (medico_id = '50000000-0000-0000-0000-000000000004' AND especialidad_id NOT IN ('60000000-0000-0000-0000-000000000004', '60000000-0000-0000-0000-000000000020'))
    OR (medico_id = '50000000-0000-0000-0000-000000000005' AND especialidad_id NOT IN ('60000000-0000-0000-0000-000000000005', '60000000-0000-0000-0000-000000000011'))
  );

INSERT INTO documento_medico (
  id, medico_id, tipo_documento, nombre_archivo, url_archivo, estado_revision, observacion_revision, administrador_revisor_id, fecha_carga, fecha_revision
) VALUES
  ('62000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'licencia_medica', 'licencia_lopez.pdf', 'https://storage.local/licencia_lopez.pdf', 'aprobado', 'Documentación validada', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '100 days', NOW() - INTERVAL '95 days'),
  ('62000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'licencia_medica', 'licencia_gomez.pdf', 'https://storage.local/licencia_gomez.pdf', 'aprobado', 'Documentación validada', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '70 days', NOW() - INTERVAL '65 days'),
  ('62000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'licencia_medica', 'licencia_navas.pdf', 'https://storage.local/licencia_navas.pdf', 'en_revision', NULL, NULL, NOW() - INTERVAL '2 days', NULL),
  ('62000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'licencia_medica', 'licencia_ruiz.pdf', 'https://storage.local/licencia_ruiz.pdf', 'aprobado', 'Documentación validada', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '55 days', NOW() - INTERVAL '50 days'),
  ('62000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', 'licencia_medica', 'licencia_castro.pdf', 'https://storage.local/licencia_castro.pdf', 'aprobado', 'Documentación validada', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '130 days', NOW() - INTERVAL '125 days')
ON CONFLICT DO NOTHING;

INSERT INTO disponibilidad_medico (
  id, medico_id, dia_semana, hora_inicio, hora_fin, duracion_bloque_minutos, zona_horaria, esta_activa, vigente_desde, vigente_hasta
) VALUES
  ('63000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, '08:00', '12:00', 30, 'America/Bogota', TRUE, CURRENT_DATE - 30, NULL),
  ('63000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 3, '14:00', '18:00', 30, 'America/Bogota', TRUE, CURRENT_DATE - 30, NULL),
  ('63000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 2, '09:00', '13:00', 20, 'America/Bogota', TRUE, CURRENT_DATE - 20, NULL),
  ('63000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 4, '15:00', '19:00', 20, 'America/Bogota', TRUE, CURRENT_DATE - 20, NULL),
  ('63000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000004', 2, '07:00', '11:00', 30, 'America/Bogota', TRUE, CURRENT_DATE - 15, NULL),
  ('63000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000005', 5, '08:00', '12:00', 30, 'America/Bogota', TRUE, CURRENT_DATE - 25, NULL)
ON CONFLICT DO NOTHING;

INSERT INTO codigo_referido (id, usuario_id, codigo, tipo_generador, esta_activo, fecha_expiracion) VALUES
  ('64000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'ANA-REF-01', 'paciente', TRUE, NOW() + INTERVAL '365 days'),
  ('64000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 'SARA-REF-01', 'comisionista', TRUE, NOW() + INTERVAL '365 days')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO cita (
  id, paciente_id, medico_id, comisionista_id, codigo_referido_id, fecha_hora_inicio_programada, fecha_hora_fin_programada, zona_horaria,
  motivo_consulta, tipo_consulta, canal_atencion, estado, requiere_comisionista_en_chat, fecha_limite_cancelacion_sin_multa,
  valor_consulta, valor_multa_cancelacion, motivo_cancelacion, cancelada_por_usuario_id, fecha_creacion
) VALUES
  ('70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000002', NOW() + INTERVAL '2 days', NOW() + INTERVAL '2 days 30 minutes', 'America/Bogota', 'Dolor abdominal recurrente', 'primera_vez', 'virtual', 'confirmada', TRUE, (NOW() + INTERVAL '2 days') - INTERVAL '6 hours', 180000, 45000, NULL, NULL, NOW()),
  ('70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', NULL, NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day' + INTERVAL '20 minutes', 'America/Bogota', 'Control pediátrico de seguimiento', 'control', 'virtual', 'completada', FALSE, (NOW() - INTERVAL '1 day') - INTERVAL '6 hours', 160000, 40000, NULL, NULL, NOW() - INTERVAL '2 days'),
  ('70000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', NULL, '64000000-0000-0000-0000-000000000001', NOW() + INTERVAL '4 hours', NOW() + INTERVAL '4 hours 30 minutes', 'America/Bogota', 'Revisión de resultados de laboratorio', 'seguimiento', 'virtual', 'pendiente_confirmacion', FALSE, (NOW() + INTERVAL '4 hours') - INTERVAL '6 hours', 180000, 45000, NULL, NULL, NOW() - INTERVAL '1 hour'),
  ('70000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', NULL, NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days' + INTERVAL '20 minutes', 'America/Bogota', 'Consulta cancelada fuera de tiempo', 'primera_vez', 'virtual', 'cancelada_por_paciente', FALSE, (NOW() - INTERVAL '3 days') - INTERVAL '6 hours', 160000, 40000, 'No pudo asistir', '10000000-0000-0000-0000-000000000005', NOW() - INTERVAL '4 days'),
  ('70000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes', 'America/Bogota', 'Consulta con falla de conexión', 'seguimiento', 'virtual', 'fallida', TRUE, (NOW() - INTERVAL '5 days') - INTERVAL '6 hours', 180000, 45000, NULL, NULL, NOW() - INTERVAL '6 days'),
  ('70000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', NULL, NULL, NOW() - INTERVAL '18 days', NOW() - INTERVAL '18 days' + INTERVAL '30 minutes', 'America/Bogota', 'Seguimiento digestivo y control de sintomas', 'control', 'virtual', 'completada', FALSE, (NOW() - INTERVAL '18 days') - INTERVAL '6 hours', 180000, 45000, NULL, NULL, NOW() - INTERVAL '19 days'),
  ('70000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', NULL, NULL, NOW() - INTERVAL '11 days', NOW() - INTERVAL '11 days' + INTERVAL '30 minutes', 'America/Bogota', 'Revision de brote en piel y tratamiento topico', 'primera_vez', 'virtual', 'completada', FALSE, (NOW() - INTERVAL '11 days') - INTERVAL '6 hours', 145000, 36000, NULL, NULL, NOW() - INTERVAL '12 days'),
  ('70000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', NULL, NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days' + INTERVAL '30 minutes', 'America/Bogota', 'Chequeo cardiovascular preventivo', 'seguimiento', 'virtual', 'completada', FALSE, (NOW() - INTERVAL '6 days') - INTERVAL '6 hours', 210000, 52000, NULL, NULL, NOW() - INTERVAL '7 days')
ON CONFLICT DO NOTHING;

UPDATE cita
SET estado = 'pendiente_pago',
    fecha_expiracion_pago = NOW() + INTERVAL '30 minutes'
WHERE id = '70000000-0000-0000-0000-000000000001';

INSERT INTO historia_clinica (
  id, paciente_id, medico_creador_id, resumen_general, alergias, condiciones_cronicas, medicamentos_actuales, estado
) VALUES
  ('71000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'Paciente en buen estado general con seguimiento pediátrico frecuente.', 'Penicilina', 'Asma leve', 'Salbutamol inhalado', 'activa'),
  ('71000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Paciente con molestias digestivas intermitentes.', 'Ninguna conocida', 'Gastritis funcional', 'Omeprazol', 'activa')
ON CONFLICT DO NOTHING;

INSERT INTO nota_clinica (
  id, historia_clinica_id, cita_id, medico_id, subjetivo, objetivo, analisis, plan, fecha_creacion
) VALUES
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'Paciente reporta mejoría desde la última consulta.', 'Sin signos de alarma durante videollamada.', 'Evolución favorable.', 'Continuar tratamiento y control en tres meses.', NOW() - INTERVAL '1 day'),
  ('72000000-0000-0000-0000-000000000002', '71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000001', 'Paciente refiere mejoria parcial del dolor abdominal.', 'Abdomen sin signos de alarma.', 'Gastritis funcional en seguimiento.', 'Mantener dieta suave y control de medicamentos.', NOW() - INTERVAL '18 days'),
  ('72000000-0000-0000-0000-000000000003', '71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000004', 'Paciente consulta por lesiones leves en piel.', 'Inflamacion localizada sin sobreinfeccion.', 'Dermatitis de contacto controlable.', 'Continuar crema topica por siete dias.', NOW() - INTERVAL '11 days'),
  ('72000000-0000-0000-0000-000000000004', '71000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000005', 'Paciente sin sintomas agudos, solicita chequeo preventivo.', 'Signos vitales estables.', 'Riesgo cardiovascular bajo.', 'Reforzar actividad fisica y control anual.', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

INSERT INTO receta (
  id, cita_id, paciente_id, medico_id, fecha_emision, estado, instrucciones_generales
) VALUES
  ('73000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', 'emitida', 'Mantener hidratación y control de síntomas.'),
  ('73000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', NOW() - INTERVAL '11 days', 'emitida', 'Aplicar tratamiento topico y evitar irritantes.'),
  ('73000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', NOW() - INTERVAL '6 days', 'emitida', 'Seguir control preventivo y vigilancia de factores de riesgo.')
ON CONFLICT DO NOTHING;

INSERT INTO receta_item (
  id, receta_id, medicamento, presentacion, dosis, frecuencia, duracion_dias, indicaciones
) VALUES
  ('74000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', 'Acetaminofén', 'Jarabe 120mg/5ml', '5 ml', 'Cada 8 horas', 5, 'Usar solo en caso de fiebre o malestar'),
  ('74000000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000001', 'Salbutamol', 'Inhalador', '2 puff', 'Cada 12 horas', 10, 'Aplicar con cámara espaciadora'),
  ('74000000-0000-0000-0000-000000000003', '73000000-0000-0000-0000-000000000002', 'Hidrocortisona', 'Crema 1%', 'Aplicacion local', 'Cada 12 horas', 7, 'Aplicar solo en la zona afectada'),
  ('74000000-0000-0000-0000-000000000004', '73000000-0000-0000-0000-000000000003', 'Omega 3', 'Capsulas', '1 capsula', 'Cada 24 horas', 30, 'Tomar junto al desayuno')
ON CONFLICT DO NOTHING;

INSERT INTO pago (
  id, cita_id, paciente_id, medico_id, monto, moneda, metodo_pago, referencia_pasarela, estado, fecha_pago
) VALUES
  ('75000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 160000, 'COP', 'tarjeta', 'PAY-0001', 'pagado', NOW() - INTERVAL '1 day'),
  ('75000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 180000, 'COP', 'pse', 'PAY-0002', 'autorizado', NOW()),
  ('75000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 180000, 'COP', 'tarjeta', 'PAY-0003', 'reembolsado', NOW() - INTERVAL '5 days'),
  ('75000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 180000, 'COP', 'pse', 'PAY-0004', 'pagado', NOW() - INTERVAL '18 days'),
  ('75000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 145000, 'COP', 'tarjeta', 'PAY-0005', 'pagado', NOW() - INTERVAL '11 days'),
  ('75000000-0000-0000-0000-000000000006', '70000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', 210000, 'COP', 'tarjeta', 'PAY-0006', 'pagado', NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

INSERT INTO comision (
  id, cita_id, pago_id, usuario_beneficiario_id, tipo_beneficiario, codigo_referido_id, monto_base, porcentaje_comision, monto_comision, estado, fecha_calculo, fecha_liquidacion
) VALUES
  ('76000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '75000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'paciente', NULL, 160000, 5.00, 8000, 'liquidada', NOW() - INTERVAL '1 day', NOW() - INTERVAL '20 hours'),
  ('76000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000005', '75000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000007', 'comisionista', '64000000-0000-0000-0000-000000000002', 180000, 12.50, 22500, 'cancelada', NOW() - INTERVAL '5 days', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO saldo_usuario (id, usuario_id, saldo_disponible, saldo_retenido, moneda, fecha_actualizacion) VALUES
  ('77000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 0, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 0, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 0, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 0, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 12000, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 8000, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 22500, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 0, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000009', 0, 0, 'COP', NOW()),
  ('77000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000010', 0, 0, 'COP', NOW())
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO movimiento_saldo (
  id, saldo_usuario_id, usuario_id, tipo_movimiento, origen_movimiento, origen_id, monto, descripcion, estado, fecha_creacion
) VALUES
  ('78000000-0000-0000-0000-000000000001', '77000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'credito', 'comision', '76000000-0000-0000-0000-000000000001', 8000, 'Comisión por referido aplicado a consulta completada', 'aplicado', NOW() - INTERVAL '20 hours'),
  ('78000000-0000-0000-0000-000000000002', '77000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'credito', 'devolucion', '70000000-0000-0000-0000-000000000005', 22500, 'Compensación por cita fallida', 'aplicado', NOW() - INTERVAL '4 days'),
  ('78000000-0000-0000-0000-000000000003', '77000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'credito', 'devolucion', '70000000-0000-0000-0000-000000000004', 12000, 'Devolución parcial por cancelación', 'aplicado', NOW() - INTERVAL '3 days')
ON CONFLICT DO NOTHING;

INSERT INTO calificacion_medico (
  id, cita_id, paciente_id, medico_id, puntaje, comentario, estado, fecha_creacion
) VALUES
  ('79000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 5, 'Excelente atención y seguimiento claro.', 'publicada', NOW() - INTERVAL '20 hours'),
  ('79000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 5, 'Consulta clara y seguimiento oportuno.', 'publicada', NOW() - INTERVAL '17 days'),
  ('79000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 5, 'Muy buena explicacion del tratamiento dermatologico.', 'publicada', NOW() - INTERVAL '10 days'),
  ('79000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000005', 4, 'Chequeo preventivo ordenado y profesional.', 'publicada', NOW() - INTERVAL '5 days')
ON CONFLICT DO NOTHING;

INSERT INTO chat_consulta (id, cita_id, estado, fecha_apertura, fecha_cierre) VALUES
  ('80000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', 'cerrado', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
  ('80000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'abierto', NOW() - INTERVAL '10 minutes', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO participante_chat_consulta (
  id, chat_consulta_id, usuario_id, rol_participante, autorizado_por_paciente, fecha_ingreso, fecha_salida
) VALUES
  ('81000000-0000-0000-0000-000000000001', '80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'medico', TRUE, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
  ('81000000-0000-0000-0000-000000000002', '80000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000006', 'paciente', TRUE, NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
  ('81000000-0000-0000-0000-000000000003', '80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'medico', TRUE, NOW() - INTERVAL '10 minutes', NULL),
  ('81000000-0000-0000-0000-000000000004', '80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000005', 'paciente', TRUE, NOW() - INTERVAL '10 minutes', NULL),
  ('81000000-0000-0000-0000-000000000005', '80000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000007', 'comisionista', TRUE, NOW() - INTERVAL '5 minutes', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO notificacion (
  id, usuario_id, cita_id, tipo_notificacion, canal, mensaje, estado, fecha_programada_envio, fecha_envio
) VALUES
  ('82000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000001', 'recordatorio_10_minutos', 'email', 'Tu consulta inicia en 10 minutos.', 'programada', (SELECT fecha_hora_inicio_programada - INTERVAL '10 minutes' FROM cita WHERE id = '70000000-0000-0000-0000-000000000001'), NULL),
  ('82000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'recordatorio_10_minutos', 'sms', 'La consulta con tu paciente inicia en 10 minutos.', 'programada', (SELECT fecha_hora_inicio_programada - INTERVAL '10 minutes' FROM cita WHERE id = '70000000-0000-0000-0000-000000000001'), NULL),
  ('82000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000005', '70000000-0000-0000-0000-000000000001', 'recordatorio_5_minutos', 'email', 'Tu consulta inicia en 5 minutos.', 'programada', (SELECT fecha_hora_inicio_programada - INTERVAL '5 minutes' FROM cita WHERE id = '70000000-0000-0000-0000-000000000001'), NULL),
  ('82000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', 'recordatorio_5_minutos', 'sms', 'La consulta con tu paciente inicia en 5 minutos.', 'programada', (SELECT fecha_hora_inicio_programada - INTERVAL '5 minutes' FROM cita WHERE id = '70000000-0000-0000-0000-000000000001'), NULL)
ON CONFLICT DO NOTHING;

INSERT INTO auditoria (
  id, usuario_actor_id, entidad, entidad_id, accion, valores_anteriores, valores_nuevos
) VALUES
  ('83000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'perfil_medico', '50000000-0000-0000-0000-000000000001', 'aprobar_medico', '{"estado_validacion":"documentacion_en_revision"}', '{"estado_validacion":"activo"}'),
  ('83000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'calificacion_medico', '79000000-0000-0000-0000-000000000001', 'crear_calificacion', NULL, '{"puntaje":5}')
ON CONFLICT DO NOTHING;

COMMIT;
