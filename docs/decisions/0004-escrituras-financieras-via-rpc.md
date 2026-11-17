# ADR-0004: Escrituras financieras y de membresía solo mediante RPC transaccionales

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §5.2.1, §8.5, §10

## Contexto
Aprobar un pago modifica varias tablas (pago, asignaciones, saldos de cobros, auditoría, notificaciones) y debe ser atómico, resistente a la concurrencia y validado en el backend (plan §8.3 y §9.2). Con escrituras directas por PostgREST, cada tabla se actualizaría por separado y la RLS no puede expresar transiciones de estado ("solo de `in_review` a `approved`").

## Decisión
- `charges`, `charge_items`, `payments`, `payment_allocations`, `memberships`, `invitations`, `audit_logs` y `outbox_events` **no tienen privilegios de escritura** para `anon` ni `authenticated`.
- Toda escritura sobre ellas se hace con **funciones RPC** `SECURITY DEFINER` que verifican explícitamente el usuario y el rol, validan, bloquean filas en orden determinista (`FOR UPDATE`), auditan y emiten eventos en la misma transacción.
- Las transiciones de estado de los contratos (`activate`, `terminate`, `renew`) también son RPC; los borradores se editan directamente con RLS.

## Alternativas consideradas
- **Escrituras directas + triggers de validación.** Las reglas quedan dispersas y los errores son difíciles de explicar al usuario.
- **Edge Functions con la clave secreta.** Añade latencia, pierde la transacción única con la base de datos y concentra un privilegio total en código Deno.

## Consecuencias
- ✅ Atomicidad y consistencia garantizadas por PostgreSQL.
- ✅ Un único punto por operación para auditar, probar y versionar.
- ⚠️ `SECURITY DEFINER` omite la RLS: cada función **debe** verificar permisos. Se usa una plantilla obligatoria y pruebas pgTAP.
- ⚠️ Cambiar la firma de una RPC rompe apps antiguas: se versionan (`_v2`) con *expand/contract*.
