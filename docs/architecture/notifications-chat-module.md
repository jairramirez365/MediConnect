# Modulo de Notificaciones y Chat

## Objetivo

Este modulo agrega a MediConnect:

- verificacion obligatoria de correo y telefono
- notificaciones transaccionales multicanal
- recordatorios automaticos de citas
- panel de notificaciones por usuario
- auditoria administrativa de entregas
- chat interno entre roles autorizados

La implementacion fue construida para integrarse con la arquitectura actual sin acoplar la logica del negocio a un proveedor especifico de mensajeria.

## Componentes backend

### Nuevas tablas y ampliaciones

- `usuario`
  - `correo_verificado_at`
  - `telefono_verificado_at`
- `verificacion_contacto`
  - trazabilidad de OTP, token seguro, reenvios, intentos y bloqueos
- `notificacion`
  - tipo de evento, canal, destinatario, proveedor, estados de entrega, payload y metadata
- `conversacion`
- `participante_conversacion`
- `mensaje_conversacion`

## Endpoints principales

### Verificacion de cuenta

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/resend-verification`
- `POST /api/v1/auth/verify-contact`
- `GET /api/v1/auth/verification-status/:userId`

### Notificaciones

- `GET /api/v1/notifications/me`
- `GET /api/v1/notifications/me/unread-summary`
- `GET /api/v1/notifications/me/:id`
- `PATCH /api/v1/notifications/me/:id/read`
- `GET /api/v1/notifications/admin/history`
- `POST /api/v1/notifications/admin/:id/retry`
- `POST /api/v1/notifications/admin/run-jobs`

### Chat

- `GET /api/v1/chat/contacts`
- `GET /api/v1/chat/conversations`
- `POST /api/v1/chat/conversations`
- `GET /api/v1/chat/conversations/:id`
- `POST /api/v1/chat/conversations/:id/messages`
- `PATCH /api/v1/chat/conversations/:id/read`

## Reglas implementadas

### Verificacion

- toda cuenta nueva nace en `pendiente_verificacion`
- se emite OTP para correo y para telefono
- el codigo OTP no se expone por API
- existe limite de intentos y de reenvios
- el usuario pasa a `activo` cuando verifica ambos canales requeridos
- si el usuario abandona el flujo, puede retomarlo desde login

### Notificaciones de cita

Se disparan eventos automaticos para:

- `cita_agendada`
- `cita_modificada`
- `cita_cancelada`
- `cita_recordatorio_5_minutos`

Canales usados por defecto:

- `interno`
- `email`
- `whatsapp`
- `sms`

### Chat por rol

- paciente <-> gestor dentro de su alcance
- medico <-> gestor dentro de su alcance
- administrador <-> gestor
- administrador <-> medico

El sistema bloquea conversaciones fuera de alcance segun citas y vinculaciones reales.

## Frontend integrado

### Pantallas nuevas

- `VerifyAccount`
- `NotificationsCenter`
- `ChatCenter`

### Mejoras de navegacion

- campana de notificaciones en header
- contador de no leidas
- acceso rapido a chat en header
- panel de notificaciones para todos los roles
- vista administrativa con filtros y reintento de envios
- lista de contactos disponibles para iniciar chat

## Variables de entorno

Agregar o revisar en backend:

```env
VERIFICATION_OTP_LENGTH=6
VERIFICATION_OTP_EXPIRES_MINUTES=10
VERIFICATION_MAX_ATTEMPTS=5
VERIFICATION_MAX_RESENDS=3
VERIFICATION_LOCK_MINUTES=15
VERIFICATION_PHONE_CHANNEL=whatsapp

NOTIFICATIONS_PROVIDER=mock
NOTIFICATIONS_APP_BASE_URL=http://localhost:5173
NOTIFICATIONS_SUPPORT_EMAIL=soporte@mediconnect.local
NOTIFICATIONS_SCHEDULER_ENABLED=true
NOTIFICATIONS_SCHEDULER_INTERVAL_MS=60000

EMAIL_PROVIDER=mock
EMAIL_FROM=soporte@mediconnect.local

SMS_PROVIDER=mock
SMS_SENDER=MediConnect

WHATSAPP_PROVIDER=mock
WHATSAPP_SENDER=MediConnect
```

## Payloads de ejemplo

### Reenviar verificacion

```json
{
  "userId": "10000000-0000-0000-0000-000000000001",
  "channel": "email"
}
```

### Verificar canal

```json
{
  "userId": "10000000-0000-0000-0000-000000000001",
  "channel": "whatsapp",
  "code": "123456"
}
```

### Abrir conversacion

```json
{
  "counterpartUserId": "10000000-0000-0000-0000-000000000010",
  "subject": "Coordinacion de cita"
}
```

### Enviar mensaje

```json
{
  "content": "Hola, necesito apoyo con la disponibilidad de la paciente para manana."
}
```

## Flujo de prueba recomendado

### 1. Verificacion de correo

1. Registrar una cuenta nueva.
2. Confirmar que la respuesta trae `verificationRequired`.
3. Abrir la vista `Activa tu cuenta`.
4. Ingresar OTP de correo.
5. Validar que el canal quede en `verificada`.

### 2. Verificacion de telefono

1. Desde la misma pantalla, ingresar OTP de `sms` o `whatsapp`.
2. Validar que el usuario pase a `activo`.
3. Confirmar que el login ya funcione normalmente.

### 3. Agendamiento con notificaciones

1. Crear o confirmar una cita.
2. Validar registros en `notifications/me`.
3. Confirmar que existan entradas por `interno`, `email`, `whatsapp` y `sms`.

### 4. Recordatorio cinco minutos antes

1. Crear una cita cercana o ejecutar `POST /notifications/admin/run-jobs`.
2. Confirmar nuevas notificaciones de tipo `cita_recordatorio_5_minutos`.

### 5. Chat paciente-gestor

1. Ingresar con paciente vinculado.
2. Abrir `Chat`.
3. Seleccionar un gestor permitido.
4. Enviar mensaje y confirmar historial.

### 6. Chat medico-gestor

1. Ingresar con medico vinculado.
2. Abrir conversacion con gestor dentro de alcance.
3. Enviar mensaje y confirmar lectura.

### 7. Chat administrador

1. Ingresar como administrador.
2. Abrir `Chat`.
3. Crear conversacion con gestor o medico.
4. Validar acceso y trazabilidad.

## Estado actual del proveedor

El modulo corre hoy con proveedor `mock`, pero la arquitectura ya deja desacopladas estas piezas:

- `notifications/providers.js`
- configuracion por `env`
- endpoints internos sin dependencia del proveedor final

Esto permite reemplazar facilmente el adaptador por:

- correo transaccional real
- SMS real
- WhatsApp real
- futuras `push notifications`

## Validacion ejecutada

- `backend`: `npm test` -> `19/19`
- `frontend`: `npm run build` -> correcto
