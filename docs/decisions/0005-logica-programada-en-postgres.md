# ADR-0005: Lógica programada en PostgreSQL; Edge Functions solo para integraciones

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §10.2, §11

## Contexto
La generación mensual de cobros debe ejecutarse en el backend, sin duplicados y aunque el proceso se interrumpa (plan §8.3 y §10.5). El plan menciona Edge Functions para operaciones de servidor.

## Decisión
- Los procesos que **solo tocan datos** (generar cobros, vencer invitaciones) son funciones PL/pgSQL del esquema `private`, programadas con **`pg_cron`**.
- Las **Edge Functions** se reservan para lo que necesita secretos o servicios externos: correo, push, pasarelas, facturación electrónica y la API de administración de Auth.
- Cuando un proceso de datos necesita notificar, escribe en `outbox_events` y `pg_cron` + `pg_net` invocan la Edge Function que despacha (ADR-0014).

## Alternativas consideradas
- **Edge Function programada que genera los cobros.** Cada inserción sería una llamada HTTP independiente: se pierde la transacción única y se complica la idempotencia.
- **Generación desde el dispositivo.** Explícitamente descartada por el plan.

## Consecuencias
- ✅ Idempotencia por índices únicos y transacciones reales; recuperación automática si el cron se detiene.
- ✅ Sin latencia de red entre la lógica y los datos.
- ⚠️ Más código PL/pgSQL; requiere pruebas pgTAP y revisión cuidadosa.
- ⚠️ `pg_cron` trabaja en UTC: los horarios se documentan en ambas zonas.
