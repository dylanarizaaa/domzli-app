# ADR-0011: Membresías fuera del JWT; autorización por funciones auxiliares

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §8.1, §8.3

## Contexto
Supabase permite añadir *claims* al JWT con un *Custom Access Token Hook*. Incluir las organizaciones y roles en el token evitaría consultar `memberships` en cada política.

## Decisión
En el MVP, **las membresías no viajan en el JWT**. Las políticas usan helpers `private.*` que consultan `memberships` con índices, con el patrón de subconsulta evaluada una vez por consulta.

## Alternativas consideradas
- **Claims en el JWT.** Más rápido por consulta, pero un cambio de rol o una revocación no surten efecto hasta que el token expira (hasta una hora), y el token crece con el número de organizaciones.

## Consecuencias
- ✅ Revocar el acceso de un inquilino o empleado es inmediato.
- ⚠️ Un pequeño costo por consulta. Si las métricas de rendimiento lo justifican, se puede reevaluar con un ADR nuevo.
