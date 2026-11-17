# ADR-0014: Notificaciones mediante *outbox* transaccional

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §11.2 · ADR-0005

## Contexto
Generar un cobro o aprobar un pago debe notificar al inquilino por correo (F2) y push (F3). Llamar al proveedor dentro de la transacción la alarga y la hace depender de un tercero; llamarlo después puede perder la notificación si el proceso falla.

## Decisión
Las RPC y procesos insertan un evento en `outbox_events` **en la misma transacción** que el cambio de negocio. Cada minuto, `pg_cron` + `pg_net` invocan la Edge Function `dispatch-notifications`, que toma lotes con `FOR UPDATE SKIP LOCKED`, envía con reintentos y retroceso exponencial (máximo 5 intentos) y marca cada evento como `done` o `failed`.

## Alternativas consideradas
- **Database Webhooks por fila.** Más simple, pero sin reintentos controlados ni procesamiento por lotes.
- **Envío directo desde la app.** Inseguro (secretos en el cliente) y poco fiable.

## Consecuencias
- ✅ Ninguna notificación se pierde ni se envía por una transacción revertida.
- ✅ El mismo mecanismo sirve para facturación electrónica y webhooks salientes.
- ⚠️ Entrega "al menos una vez": los consumidores deben ser idempotentes (clave por `outbox_events.id`).
