# Prompt Tecnico De Implementacion: Paneles De Pagos Multirol MediConnect

## Objetivo
Implementar un modulo de pagos real para `paciente`, `medico`, `gestor` y `administrador`, conectado al backend actual y preparado para una integracion futura con `PSE`, sin romper la arquitectura ya construida ni degradar la experiencia visual del producto.

## Principios De Ejecucion
- Conservar el modelo de datos existente y reutilizar al maximo las tablas `pago`, `comision`, `saldo_usuario`, `movimiento_saldo`, `cita` y `codigo_referido`.
- No construir maquetas falsas donde ya existan datos reales en base de datos.
- Mantener separacion por capas en backend: `routes -> controller -> service -> repository`.
- Mantener el lenguaje visual ya consolidado en frontend y aplicar el `frontend-ux-prompt`.
- Diseñar la arquitectura para que el flujo `dummy/staging` sea reemplazable por `PSE` sin reproceso estructural.

## Alcance Funcional

### Backend
- Exponer un API de pagos multirol con endpoints reales para:
  - consultar resumen de pagos por rol
  - listar pagos por rol con filtros
  - listar citas pagables del paciente
  - iniciar checkout tipo `PSE` en modo staging
  - simular confirmacion exitosa del pago para entorno local/staging
- Mantener el endpoint `dummy` existente por compatibilidad, pero reubicar la logica para que el flujo recomendado pase por `checkout -> confirmacion`.
- Incluir datos de comisiones y saldo cuando apliquen para `gestor` y `paciente`.
- Permitir lectura administrativa de todos los pagos.

### Frontend
- Crear o reconectar paneles de pagos para:
  - `paciente`
  - `medico`
  - `gestor`
  - `administrador`
- Integrar cada panel al menu lateral y a los accesos rapidos que tengan sentido por rol.
- En `paciente`, permitir iniciar pago desde citas pagables y completar un flujo de checkout staging orientado a PSE.
- En `medico`, mostrar visibilidad sobre consultas pagadas, pendientes y recaudo.
- En `gestor`, mostrar pagos vinculados a referidos, comisiones y saldo disponible.
- En `administrador`, mostrar monitoreo global, filtros y seguimiento operativo.

## Arquitectura Objetivo Para PSE

### Flujo de negocio esperado
1. El paciente identifica una cita pagable.
2. El frontend solicita al backend iniciar un checkout PSE.
3. El backend crea o reutiliza un registro de pago en estado `pendiente`.
4. El backend devuelve una estructura preparada para proveedor externo:
   - referencia
   - metodo de pago
   - estado
   - identificador del pago
   - datos para redireccion o tracking
5. En entorno local/staging, el frontend puede simular la aprobacion para cerrar el flujo.
6. En produccion, este mismo punto sera reemplazado por:
   - retorno del usuario desde pasarela
   - webhook/notificacion del proveedor
   - confirmacion server to server
7. Tras pago exitoso:
   - el pago pasa a `pagado`
   - se calcula la comision si aplica
   - se actualiza saldo del beneficiario
   - se registra movimiento de saldo
   - se escribe auditoria

### Decisiones de diseño
- No acoplar frontend a la pasarela real aun.
- No hardcodear URLs productivas.
- Dejar el contrato del checkout con nombres y estructura compatibles con una futura capa `payments providers`.
- Mantener `pse` como metodo soportado desde ahora.

## Entregables Tecnicos

### Backend
- Nuevos endpoints o ampliacion del modulo `payments`
- Servicios de resumen y listado por rol
- Inicializacion de checkout PSE staging
- Confirmacion simulada de pago exitoso
- Consultas SQL con joins a citas, usuarios, comisiones y saldos
- Pruebas automatizadas adicionales

### Frontend
- Pantalla de pagos del paciente conectada a API real
- Pantalla de pagos del medico conectada a API real
- Pantalla de pagos del gestor conectada a API real
- Pantalla de pagos del administrador conectada a API real
- Navegacion integrada
- Estados `loading`, `error`, `empty`
- Flujo visual de checkout staging

## Casos Minimos De Validacion
- El paciente puede ver pagos existentes y citas pendientes de pago.
- El paciente puede iniciar checkout `PSE` y simular pago exitoso.
- El medico puede ver los pagos asociados a sus citas.
- El gestor puede ver comisiones, pagos vinculados y saldo.
- El administrador puede ver el consolidado global.
- El pago exitoso genera o liquida comision cuando corresponde.
- Las pruebas automatizadas del backend deben seguir pasando.
- El frontend debe compilar correctamente.

## Restricciones
- No rediseñar la base de datos completa.
- No eliminar compatibilidad con los flujos ya probados.
- No introducir datos mock donde el backend ya tenga fuente real.
- No cambiar claves internas de roles, tablas o columnas solo por naming visual.

## Resultado Esperado
Un modulo de pagos MVP serio, transversal al sistema, funcional por rol y preparado para evolucionar a una integracion real con `PSE` y webhooks cuando el entorno publico de staging este desplegado.
