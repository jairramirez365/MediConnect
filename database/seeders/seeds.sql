BEGIN;

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
  ('10000000-0000-0000-0000-000000000008', 'luisa.paciente@mediconnect.local', '+573001110008', 'scrypt$89d2d1b5e99e6f8054c03a3b59bd2670$56c8ff99e296e2136fb0ae57e71b3a5ab11e574a567e1e3bc493dcc7d493192acc4de654fb6fbed8a4425e5967666f0a409d85494a71ecf58f1e2867616afdef', 'paciente', 'activo', NOW())
ON CONFLICT (correo_electronico) DO NOTHING;

UPDATE usuario SET contrasena_hash = 'scrypt$8f45bf7e4675b6477a1d4324d683f6ed$a2a582b0426341aba377f5c85b72421db34b20dc785485e120a7afb06c74b169b5bdfa3add1d0670f2fc113228b667b373d92e37e7161701c3cbcdd67e8060f1' WHERE correo_electronico = 'admin@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$6c84b3532a4e87b157c596655c31358a$c5d3474bef9838cc62fe9a688ca3bbe7c64ea29d23a0537b235f62df7672ca4395708bc782b2e5bb386b61deb9040ddb1480a5b64c0bee72b9915d2c03ef8b04' WHERE correo_electronico = 'dr.lopez@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$9d7f2196f00bc5624afa64fe1ebb3f55$33443c2077171dc44b1c5d7356f110ef5daa4add117af0986dc20f91fd035dc8363fd33621d03c80d360868271c3e75b713d50e2a35f73ecb27e9b475efd5cdd' WHERE correo_electronico = 'dra.gomez@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$8a135118a353937a4aab60cac75189e8$66a6a0b5cfa93dcb3100faa6bf9e46c4dba2ba932427f454fb3dd318d3d913b79f73a743ad3ab1546887039d208284b583d78997dcd97dd77ebb8c6e1cde11fc' WHERE correo_electronico = 'dr.pendiente@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$018476da63be9a47d5710a1eb49aef86$c3ece3a6731a2db533517b7f7ce8eeb47b7fa9c94872f7eee92a3939a2ca38546b70dab6ab170461e07afa100db77e02aba6766b4fcf4aa4bb5455186c1d511b' WHERE correo_electronico = 'ana.paciente@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$0c1a2290500f73d35c8f3b9eb4dfdf4c$3d61a8005b1f8706f80f24579b30e205508a984e55e1b6877aec63d6374e15a08d946e53b889ae284ada4cb271b2ee677cc895766f4b10b591a171831fd237f8' WHERE correo_electronico = 'carlos.paciente@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$35fda9837aca5197491eab131dc889d8$4a119bd93f02576ad836277fc3cb2fb44227d953bec57fc7b66a706ec54215d124aaa5c5d0b2c10a70b27f64a71f67cea66197f715c415caa1e5b78c231fbb78' WHERE correo_electronico = 'sara.comisionista@mediconnect.local';
UPDATE usuario SET contrasena_hash = 'scrypt$89d2d1b5e99e6f8054c03a3b59bd2670$56c8ff99e296e2136fb0ae57e71b3a5ab11e574a567e1e3bc493dcc7d493192acc4de654fb6fbed8a4425e5967666f0a409d85494a71ecf58f1e2867616afdef' WHERE correo_electronico = 'luisa.paciente@mediconnect.local';

INSERT INTO perfil_administrador (id, usuario_id, nombre_mostrar, alcance_permisos) VALUES
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Admin Principal', '{"medicos": "approve", "usuarios": "full", "citas": "full"}')
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO perfil_paciente (
  id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, fecha_nacimiento, sexo, tipo_sangre,
  direccion, nombre_contacto_emergencia, telefono_contacto_emergencia, autorizo_participacion_comisionista_chat
) VALUES
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000005', 'Ana María', 'Ramírez', 'CC', '1001001001', '1992-02-10', 'femenino', 'O+', 'Bogotá, Colombia', 'Marta Ramírez', '+573101001001', TRUE),
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000006', 'Carlos Andrés', 'Pérez', 'CC', '1001001002', '1987-07-20', 'masculino', 'A+', 'Medellín, Colombia', 'Laura Pérez', '+573101001002', FALSE),
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000008', 'Luisa Fernanda', 'Torres', 'CC', '1001001003', '1998-11-15', 'femenino', 'B+', 'Cali, Colombia', 'Julio Torres', '+573101001003', TRUE)
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO perfil_comisionista (
  id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, codigo_referido_principal, porcentaje_comision_base, estado
) VALUES
  ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000007', 'Sara', 'Mendoza', 'CC', '2002002001', 'SARA-SALUD-01', 12.50, 'activo')
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO perfil_medico (
  id, usuario_id, nombres, apellidos, tipo_documento, numero_documento, numero_registro_medico, biografia_profesional,
  anos_experiencia, valor_consulta, modalidad_atencion, ciudad, estado_validacion, fue_aprobado_por_administrador,
  administrador_aprobador_id, fecha_aprobacion, promedio_calificacion, cantidad_calificaciones
) VALUES
  ('50000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Julián', 'López', 'CC', '3003003001', 'RM-10001', 'Médico internista con enfoque en atención virtual.', 12, 180000, 'hibrida', 'Bogotá', 'activo', TRUE, '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '90 days', 4.80, 12),
  ('50000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Valentina', 'Gómez', 'CC', '3003003002', 'RM-10002', 'Pediatra con experiencia en seguimiento integral.', 9, 160000, 'virtual', 'Medellín', 'activo', TRUE, '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '60 days', 4.60, 8),
  ('50000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000004', 'Ricardo', 'Navas', 'CC', '3003003003', 'RM-10003', 'Médico general pendiente de validación documental.', 4, 120000, 'presencial', 'Cali', 'documentacion_en_revision', FALSE, NULL, NULL, 0, 0)
ON CONFLICT (usuario_id) DO NOTHING;

INSERT INTO especialidad (id, nombre, descripcion, estado) VALUES
  ('60000000-0000-0000-0000-000000000001', 'Medicina Interna', 'Atención integral del adulto', 'activa'),
  ('60000000-0000-0000-0000-000000000002', 'Pediatría', 'Atención para niños y adolescentes', 'activa'),
  ('60000000-0000-0000-0000-000000000003', 'Medicina General', 'Consulta general primaria', 'activa')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO medico_especialidad (id, medico_id, especialidad_id, es_principal) VALUES
  ('61000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', TRUE),
  ('61000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000002', TRUE),
  ('61000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '60000000-0000-0000-0000-000000000003', TRUE)
ON CONFLICT (medico_id, especialidad_id) DO NOTHING;

INSERT INTO documento_medico (
  id, medico_id, tipo_documento, nombre_archivo, url_archivo, estado_revision, observacion_revision, administrador_revisor_id, fecha_carga, fecha_revision
) VALUES
  ('62000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'licencia_medica', 'licencia_lopez.pdf', 'https://storage.local/licencia_lopez.pdf', 'aprobado', 'Documentación validada', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '100 days', NOW() - INTERVAL '95 days'),
  ('62000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'licencia_medica', 'licencia_gomez.pdf', 'https://storage.local/licencia_gomez.pdf', 'aprobado', 'Documentación validada', '20000000-0000-0000-0000-000000000001', NOW() - INTERVAL '70 days', NOW() - INTERVAL '65 days'),
  ('62000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'licencia_medica', 'licencia_navas.pdf', 'https://storage.local/licencia_navas.pdf', 'en_revision', NULL, NULL, NOW() - INTERVAL '2 days', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO disponibilidad_medico (
  id, medico_id, dia_semana, hora_inicio, hora_fin, duracion_bloque_minutos, zona_horaria, esta_activa, vigente_desde, vigente_hasta
) VALUES
  ('63000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 1, '08:00', '12:00', 30, 'America/Bogota', TRUE, CURRENT_DATE - 30, NULL),
  ('63000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 3, '14:00', '18:00', 30, 'America/Bogota', TRUE, CURRENT_DATE - 30, NULL),
  ('63000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 2, '09:00', '13:00', 20, 'America/Bogota', TRUE, CURRENT_DATE - 20, NULL),
  ('63000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 4, '15:00', '19:00', 20, 'America/Bogota', TRUE, CURRENT_DATE - 20, NULL)
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
  ('70000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '64000000-0000-0000-0000-000000000002', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days' + INTERVAL '30 minutes', 'America/Bogota', 'Consulta con falla de conexión', 'seguimiento', 'virtual', 'fallida', TRUE, (NOW() - INTERVAL '5 days') - INTERVAL '6 hours', 180000, 45000, NULL, NULL, NOW() - INTERVAL '6 days')
ON CONFLICT DO NOTHING;

INSERT INTO historia_clinica (
  id, paciente_id, medico_creador_id, resumen_general, alergias, condiciones_cronicas, medicamentos_actuales, estado
) VALUES
  ('71000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'Paciente en buen estado general con seguimiento pediátrico frecuente.', 'Penicilina', 'Asma leve', 'Salbutamol inhalado', 'activa'),
  ('71000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Paciente con molestias digestivas intermitentes.', 'Ninguna conocida', 'Gastritis funcional', 'Omeprazol', 'activa')
ON CONFLICT DO NOTHING;

INSERT INTO nota_clinica (
  id, historia_clinica_id, cita_id, medico_id, subjetivo, objetivo, analisis, plan, fecha_creacion
) VALUES
  ('72000000-0000-0000-0000-000000000001', '71000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'Paciente reporta mejoría desde la última consulta.', 'Sin signos de alarma durante videollamada.', 'Evolución favorable.', 'Continuar tratamiento y control en tres meses.', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

INSERT INTO receta (
  id, cita_id, paciente_id, medico_id, fecha_emision, estado, instrucciones_generales
) VALUES
  ('73000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 day', 'emitida', 'Mantener hidratación y control de síntomas.')
ON CONFLICT DO NOTHING;

INSERT INTO receta_item (
  id, receta_id, medicamento, presentacion, dosis, frecuencia, duracion_dias, indicaciones
) VALUES
  ('74000000-0000-0000-0000-000000000001', '73000000-0000-0000-0000-000000000001', 'Acetaminofén', 'Jarabe 120mg/5ml', '5 ml', 'Cada 8 horas', 5, 'Usar solo en caso de fiebre o malestar'),
  ('74000000-0000-0000-0000-000000000002', '73000000-0000-0000-0000-000000000001', 'Salbutamol', 'Inhalador', '2 puff', 'Cada 12 horas', 10, 'Aplicar con cámara espaciadora')
ON CONFLICT DO NOTHING;

INSERT INTO pago (
  id, cita_id, paciente_id, medico_id, monto, moneda, metodo_pago, referencia_pasarela, estado, fecha_pago
) VALUES
  ('75000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 160000, 'COP', 'tarjeta', 'PAY-0001', 'pagado', NOW() - INTERVAL '1 day'),
  ('75000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 180000, 'COP', 'pse', 'PAY-0002', 'autorizado', NOW()),
  ('75000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 180000, 'COP', 'tarjeta', 'PAY-0003', 'reembolsado', NOW() - INTERVAL '5 days')
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
  ('77000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000008', 0, 0, 'COP', NOW())
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
  ('79000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 5, 'Excelente atención y seguimiento claro.', 'publicada', NOW() - INTERVAL '20 hours')
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
