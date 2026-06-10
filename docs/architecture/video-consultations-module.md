# Modulo de videoconsultas MediConnect

## Diagnostico breve

Antes de este bloque, MediConnect ya tenia:

- autenticacion JWT por rol
- citas con estados y reglas de negocio
- disponibilidad medica
- paneles por rol en frontend
- notificaciones internas y multicanal en modo `mock`
- chat operativo general entre roles

Lo que faltaba era una capa propia de teleconsulta que no dependiera de un proveedor especifico y que quedara integrada al flujo real de citas, permisos, auditoria y experiencia visual.

## Objetivo implementado

Se implemento un modulo de videoconsulta desacoplado del proveedor, con proveedor `mock` para desarrollo local, integrado con:

- citas confirmadas
- pacientes
- medicos
- administradores
- notificaciones
- trazabilidad y auditoria
- chat lateral durante la sesion

## Reglas de negocio activas

- solo se prepara videoconsulta para citas `confirmada`, `en_curso` o `completada`
- la cita debe ser `virtual`
- paciente y medico solo acceden si pertenecen a la cita
- administrador puede monitorear y operar sesiones
- el acceso se entrega con ventana temporal configurable
- si la videollamada inicia, se registra `fecha_inicio_real`
- si la videollamada termina, se registra `fecha_fin_real`
- al finalizar la sesion, la cita pasa a `completada`
- si la cita se cancela o reprograma, la videoconsulta se invalida
- los secretos del proveedor nunca viajan al frontend

## Archivos creados o modificados

### Backend

- `C:\Users\azus\Documents\MediConnect\backend\src\config\env.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\routes\index.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\appointments\appointments.routes.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\appointments\appointments.repository.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\appointments\appointments.service.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\notifications\notifications.service.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\video-consultations\videoConsultation.routes.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\video-consultations\videoConsultation.controller.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\video-consultations\videoConsultation.service.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\video-consultations\videoConsultation.repository.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\video-consultations\videoConsultation.validator.js`
- `C:\Users\azus\Documents\MediConnect\backend\src\modules\video-consultations\videoProvider.service.js`

### Base de datos

- `C:\Users\azus\Documents\MediConnect\database\schemas\init.sql`
- `C:\Users\azus\Documents\MediConnect\database\seeders\seeds.sql`

### Frontend

- `C:\Users\azus\Documents\MediConnect\frontend\src\services\api.ts`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\App.tsx`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\components\Layout.tsx`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\components\StatusBadge.tsx`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\screens\PatientAppointments.tsx`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\screens\DoctorAppointments.tsx`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\screens\AdminDashboard.tsx`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\screens\AdminVideoConsultations.tsx`
- `C:\Users\azus\Documents\MediConnect\frontend\src\app\screens\PatientTeleconsult.tsx`

### Tests

- `C:\Users\azus\Documents\MediConnect\backend\tests\auth-and-doctors.test.js`

## Endpoints implementados

### Preparar sala

`POST /api/v1/appointments/:appointmentId/video-session`

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "appointmentId": "uuid",
    "provider": "mock",
    "providerRoomId": "room_abc123",
    "roomUrl": "http://localhost:5173/teleconsulta/room_abc123",
    "status": "ready",
    "accessWindow": {
      "startsAt": "2026-05-20T14:50:00.000Z",
      "endsAt": "2026-05-20T15:40:00.000Z"
    }
  }
}
```

### Obtener acceso a la sala

`GET /api/v1/appointments/:appointmentId/video-session`

Respuesta esperada:

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "provider": "mock",
    "status": "ready",
    "appointment": {
      "id": "uuid",
      "patient": "Paciente Demo",
      "doctor": "Doctor Demo",
      "specialty": "Medicina Interna",
      "scheduledStartAt": "2026-05-20T15:00:00.000Z",
      "scheduledEndAt": "2026-05-20T15:20:00.000Z"
    },
    "access": {
      "accessToken": "token_temporal",
      "joinUrl": "http://localhost:5173/teleconsulta/room_abc123?token=...",
      "expiresAt": "2026-05-20T15:30:00.000Z"
    }
  }
}
```

### Registrar inicio

`POST /api/v1/video-consultations/:id/start`

### Registrar finalizacion

`POST /api/v1/video-consultations/:id/end`

### Mensajes de la videoconsulta

`GET /api/v1/video-consultations/:id/messages`

`POST /api/v1/video-consultations/:id/messages`

Payload:

```json
{
  "content": "Paciente conectado a la videollamada"
}
```

### Monitoreo administrativo

`GET /api/v1/video-consultations?status=in_progress&provider=mock&search=ana`

## Variables de entorno requeridas

Agregar al archivo `.env` del backend:

```env
VIDEO_PROVIDER=mock
VIDEO_API_KEY=
VIDEO_API_SECRET=
VIDEO_BASE_URL=http://localhost:5173
VIDEO_TOKEN_TTL_MINUTES=60
VIDEO_ACCESS_WINDOW_MINUTES=10
```

## Prueba local recomendada

### 1. Preparar backend y frontend

```powershell
cd C:\Users\azus\Documents\MediConnect\backend
npm run dev
```

```powershell
cd C:\Users\azus\Documents\MediConnect\frontend
npm run dev
```

### 2. Flujo paciente

1. ingresar como paciente
2. abrir `Mis citas`
3. tomar una cita virtual confirmada
4. pulsar `Videoconsulta`
5. validar disponibilidad, chat lateral y acceso

### 3. Flujo medico

1. ingresar como el medico asignado a la cita
2. abrir `Mis citas`
3. pulsar `Videoconsulta`
4. iniciar la sesion
5. enviar mensaje
6. finalizar la sesion

### 4. Flujo administrador

1. ingresar como administrador
2. abrir `Videoconsultas`
3. filtrar por estado o proveedor
4. revisar sesiones en curso, completadas o con incidente

## Consideraciones tecnicas

- el proveedor `mock` sirve para desarrollo local y pruebas funcionales
- la URL de teleconsulta enviada por notificaciones es una base preparada para futura navegacion por URL publica
- el modulo incorpora una compatibilidad de esquema para bases ya existentes que aun no tengan las tablas nuevas
- la grabacion queda preparada mediante `url_grabacion`, pero no se activa todavia

## Roadmap para proveedor real

### Fase 1

- mantener `mock` en desarrollo
- definir proveedor objetivo: `Twilio`, `Daily`, `Agora` o `Vonage`
- mapear creacion de sala, generacion de token y expiracion

### Fase 2

- implementar adaptador real en `videoProvider.service.js`
- firmar tokens con credenciales del proveedor
- consumir webhooks del proveedor para inicio, fin y errores

### Fase 3

- habilitar grabacion
- persistir `recording_url`
- vincular grabacion al historial de la cita
- agregar monitoreo de calidad, reconexion y telemetria

## Estado final del modulo

El modulo queda listo para uso local con proveedor `mock`, integrado al flujo real de citas y preparado para evolucionar a un proveedor de videollamadas real sin rehacer la arquitectura central.
