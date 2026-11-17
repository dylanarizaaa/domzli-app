# ADR-0010: TanStack Query como estado del servidor; sin mutaciones financieras sin conexión

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §6.3, §6.7

## Contexto
La app debe funcionar con conexiones inestables al consultar (plan §14), pero "las operaciones financieras no se confirmarán localmente sin validación del backend".

## Decisión
- **TanStack Query** para todo dato del servidor, con *query keys* que incluyen el `organizationId`.
- **Caché persistida** de lecturas (24 h) para consultar sin conexión.
- Mutaciones con `networkMode: 'online'`: sin red, las acciones financieras se deshabilitan con una explicación. **Sin actualizaciones optimistas** en operaciones financieras.
- **Zustand** solo para estado de interfaz (contexto activo, preferencias). Nunca duplica datos del servidor.

## Alternativas consideradas
- **Base de datos local con sincronización (WatermelonDB, PowerSync).** Permite escritura sin conexión, pero añade resolución de conflictos y contradice la regla financiera del plan.
- **Redux Toolkit Query.** Capacidad similar con más código repetitivo.

## Consecuencias
- ✅ Modelo mental simple: el servidor es la verdad y el cliente guarda una caché.
- ⚠️ Sin conexión no se pueden crear registros. Aceptable en el MVP; se revisará si los usuarios lo piden para operaciones no financieras.
- ⚠️ La caché persistida contiene datos personales: se borra al cerrar sesión.
