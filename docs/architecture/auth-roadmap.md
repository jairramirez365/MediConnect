# Auth + roles + permisos

## Objetivo

Convertir el backend inicial en una API con identidad real, control por rol y base segura para construir citas, perfiles, historia clínica, pagos y administración.

## Alcance inmediato

- Registro de usuario.
- Login con contraseña hasheada.
- Token de acceso firmado.
- Endpoint `me` para leer la sesión actual.
- Middleware `authenticate`.
- Middleware `authorizeRoles`.
- Restricción inicial por rol sobre rutas sensibles.

## Reglas base

- El backend nunca debe devolver `contrasena_hash`.
- El rol permitido debe validarse desde el token y, cuando haga falta, desde base de datos.
- Un usuario bloqueado, inactivo o eliminado no debe iniciar sesión.
- Las rutas públicas iniciales son `health`, búsqueda de médicos y login/register.
- Las rutas de citas deben requerir usuario autenticado.

## Orden de trabajo

1. Utilidades de password y token.
2. Repositorio de auth sobre tabla `usuario`.
3. Servicio con reglas de login/register.
4. Controller y rutas REST.
5. Middlewares de autenticación/autorización.
6. Proteger rutas de citas.
7. Pruebas manuales con login y token.

## Siguiente bloque: ownership real de citas

### Objetivo

Convertir la autenticación en permisos reales de producto. El backend debe decidir qué puede ver o modificar cada usuario según su rol y perfil asociado, no según IDs enviados libremente desde el cliente.

### Reglas aceptadas para implementar ahora

- Paciente autenticado solo ve sus propias citas.
- Médico autenticado solo ve sus propias citas.
- Comisionista autenticado solo ve citas donde está asociado.
- Administrador puede ver todas las citas.
- Paciente autenticado no puede crear citas para otro paciente.
- Al crear cita como paciente, `paciente_id` se resuelve desde el token y su perfil.
- Solo médicos activos pueden recibir citas.
- No se permiten citas solapadas para el mismo médico.
- Se respeta disponibilidad médica.
- Al crear cita se programan recordatorios a paciente y médico a 10 y 5 minutos.
- Cancelación por paciente con menos de 6 horas aplica multa.
- Comisionista solo puede participar si el paciente autorizó su participación.

### Endpoints de negocio

- `GET /api/v1/appointments`
- `POST /api/v1/appointments`
- `PATCH /api/v1/appointments/:id/confirm`
- `PATCH /api/v1/appointments/:id/cancel`
- `PATCH /api/v1/appointments/:id/reschedule`
- `PATCH /api/v1/appointments/:id/complete`

### Reglas que quedan fuera por ahora

- Cobro real de multa en pasarela.
- Generación automática de devolución.
- Reembolso real en pasarela.
- Chat en tiempo real.
- Videollamada.
- Pagos reales.
- Firma o validación legal de receta.

## Endpoints previstos

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
