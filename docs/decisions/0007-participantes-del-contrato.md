# ADR-0007: Participantes del contrato mediante `lease_tenants`

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §9.2 · Decisión pendiente P-3

## Contexto
El plan define el contrato como la relación entre un inmueble y "uno o varios participantes", pero la tabla `leases` no tenía relación con `tenants`. En Colombia es habitual el **codeudor** (deudor solidario), además de posibles cotitulares.

## Decisión
Tabla de unión `lease_tenants (lease_id, tenant_id, role, portal_access)` con `role` en `primary`, `co_tenant` o `guarantor`, y un índice único que permite **un solo `primary`** por contrato. La UI del MVP gestiona un titular y, opcionalmente, codeudores sin acceso al portal.

## Alternativas consideradas
- **`leases.tenant_id`.** Más simple hoy, pero añadir cotitulares después exigiría migrar datos y reescribir políticas RLS.

## Consecuencias
- ✅ El modelo soporta cotitulares y codeudores sin migraciones futuras.
- ✅ La RLS del inquilino se basa en `lease_tenants` y `portal_access`.
- ⚠️ Las consultas del titular requieren un join (se cubre con la vista `v_lease_overview`).
