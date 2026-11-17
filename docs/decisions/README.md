# Registro de decisiones de arquitectura (ADR)

Cada ADR documenta **una** decisión con alternativas reales: el contexto, la decisión, las opciones descartadas y las consecuencias. Los ADR no se editan después de aceptados; si una decisión cambia, se crea uno nuevo que **reemplaza** al anterior y se actualiza el estado de ambos.

**Estados:** `Propuesta` → `Aceptada` → (`Reemplazada por ADR-XXXX` | `Obsoleta`).

| ADR | Decisión | Estado |
|---|---|---|
| [0001](0001-cliente-unico-expo.md) | Cliente único multiplataforma con Expo, Expo Router y React Native Web | Aceptada (plan v2.0) |
| [0002](0002-supabase-como-backend.md) | Supabase como backend gestionado, sin servidor de aplicaciones propio | Aceptada (plan v2.0) |
| [0003](0003-multitenencia-y-rls.md) | Multi-organización por fila con `organization_id` y autorización con RLS | Aceptada (plan v2.0) |
| [0004](0004-escrituras-financieras-via-rpc.md) | Escrituras financieras y de membresía solo mediante RPC transaccionales | Propuesta |
| [0005](0005-logica-programada-en-postgres.md) | Lógica programada en PostgreSQL; Edge Functions solo para integraciones | Propuesta |
| [0006](0006-invitaciones-propias.md) | Invitaciones con tabla propia y token de un solo uso ligado al correo | Propuesta |
| [0007](0007-participantes-del-contrato.md) | Participantes del contrato mediante `lease_tenants` | Propuesta |
| [0008](0008-representacion-de-montos.md) | Montos `numeric(14,2)`; cálculo autoritativo en la base de datos | Propuesta |
| [0009](0009-design-system-propio.md) | Design System propio sobre NativeWind con variantes `cva` | Propuesta |
| [0010](0010-estado-servidor-y-offline.md) | TanStack Query como estado del servidor; sin mutaciones financieras sin conexión | Propuesta |
| [0011](0011-membresias-fuera-del-jwt.md) | Membresías fuera del JWT; autorización por funciones auxiliares | Propuesta |
| [0012](0012-storage-privado.md) | Storage privado con rutas por organización y URLs firmadas | Propuesta |
| [0013](0013-estrategia-de-pruebas.md) | pgTAP para RLS y RPC, Vitest para lógica pura, Jest + RNTL para componentes | Propuesta |
| [0014](0014-outbox-de-notificaciones.md) | Notificaciones mediante *outbox* transaccional | Propuesta |
| [0015](0015-direccion-visual-billetera.md) | Dirección visual "Billetera digital" para las pantallas de inicio | Aceptada |

## Plantilla

```markdown
# ADR-XXXX: Título en forma de decisión

- **Estado:** Propuesta
- **Fecha:** AAAA-MM-DD
- **Relacionado con:** TAD §x.y, ADR-YYYY

## Contexto
Qué problema hay que resolver y qué fuerzas intervienen.

## Decisión
Qué se decide, en una o dos frases, y los detalles necesarios para aplicarla.

## Alternativas consideradas
- **Opción A.** Por qué se descarta.

## Consecuencias
- ✅ Positivas.
- ⚠️ Negativas o costos asumidos.
```
