# ADR-0002: Supabase como backend gestionado, sin servidor de aplicaciones propio

- **Estado:** Aceptada (definida en el plan v2.0)
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §4, §5.2

## Contexto
El producto necesita autenticación, base de datos relacional con transacciones, almacenamiento de archivos y tareas programadas, sin dedicar esfuerzo a operar servidores.

## Decisión
Usar **Supabase**: PostgreSQL como fuente de verdad, Supabase Auth, Storage, Edge Functions (Deno) y las extensiones `pg_cron` y `pg_net`. No se construye un servidor de aplicaciones propio. La API de datos es PostgREST sobre el esquema `public`.

## Alternativas consideradas
- **Backend propio (NestJS o Fastify) sobre PostgreSQL gestionado.** Mayor control y portabilidad, pero obliga a operar servidores, autenticación y despliegues.
- **Firebase.** Maduro en móvil, pero su modelo documental complica las reglas financieras transaccionales y los reportes relacionales.

## Consecuencias
- ✅ Tiempo de salida al mercado corto y operación mínima.
- ✅ PostgreSQL estándar: las restricciones, transacciones y RLS son portables.
- ⚠️ Dependencia del proveedor en Auth y Storage (riesgo R4 del TAD).
- ⚠️ La lógica de negocio crítica vive en SQL/PL/pgSQL; exige convenciones y pruebas (ADR-0004, ADR-0013).
