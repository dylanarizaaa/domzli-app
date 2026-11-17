# ADR-0013: pgTAP para RLS y RPC, Vitest para lógica pura, Jest + RNTL para componentes

- **Estado:** Propuesta (ajusta el plan v2.0, §5.1)
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §14

## Contexto
El plan define Vitest y React Native Testing Library. RNTL está pensada para Jest, y el *preset* `jest-expo` resuelve las transformaciones de los paquetes de React Native y Expo; ejecutarla con Vitest exige configuraciones no oficiales. Por otra parte, la frontera de seguridad real está en la base de datos y el plan no definía cómo probarla.

## Decisión
- **pgTAP** (`supabase test db`) para cada política RLS (casos positivos y negativos por rol) y para cada RPC. Es el nivel de mayor prioridad.
- **Vitest** para TypeScript puro: `features/*/domain`, `lib/money`, `lib/dates` y esquemas Zod.
- **Jest + `jest-expo` + RNTL** para componentes.
- **Maestro** (móvil) y **Playwright** (web) para los flujos críticos de extremo a extremo.

## Alternativas consideradas
- **Solo Jest.** Válido, pero más lento para la lógica pura.
- **Solo Vitest.** Requiere configuraciones no oficiales para React Native.

## Consecuencias
- ✅ Cada herramienta en el terreno donde es estable.
- ⚠️ Dos ejecutores de pruebas en el proyecto; se separan por carpeta y por script (`test:unit`, `test:components`, `test:db`).
