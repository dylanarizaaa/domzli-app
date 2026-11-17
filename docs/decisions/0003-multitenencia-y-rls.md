# ADR-0003: Multi-organización por fila con `organization_id` y autorización con RLS

- **Estado:** Aceptada (principio del plan v2.0; detalles propuestos en el TAD)
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §8 · ADR-0011

## Contexto
Domzli empieza con propietarios individuales y evoluciona a SaaS con inmobiliarias. Los datos de una organización nunca pueden ser visibles para otra, y la interfaz no es un mecanismo de autorización (plan §9).

## Decisión
- Esquema compartido; **toda tabla de negocio** tiene `organization_id`, incluidas las tablas hijas.
- **RLS habilitado en todas las tablas** de `public`, con denegación por defecto.
- Políticas basadas en funciones auxiliares `SECURITY DEFINER` del esquema `private` con el patrón `organization_id in (select private.staff_org_ids())`.
- **FK compuestas** `(organization_id, id)` para que contratos, inmuebles, inquilinos y cobros pertenezcan siempre a la misma organización.
- `organization_id` es inmutable después de insertar (trigger).

## Alternativas consideradas
- **Un esquema por organización.** Aislamiento fuerte, pero las migraciones y los reportes de plataforma se multiplican.
- **Un proyecto o base de datos por organización.** Costoso e inviable para un modelo freemium.
- **Autorización en una capa de API propia.** Contradice ADR-0002 y deja el acceso directo a la base de datos sin protección.

## Consecuencias
- ✅ Un solo esquema y migraciones simples; preparado para SaaS desde el inicio.
- ✅ La autorización se aplica a cualquier cliente, incluidas llamadas manuales a la API.
- ⚠️ Un error en una política expone datos: se exigen pruebas pgTAP negativas por tabla y rol (ADR-0013).
- ⚠️ Las políticas añaden costo a las consultas; se mitiga con índices y con el patrón de subconsulta evaluada una vez.
