# Domzli

Plataforma para administrar propiedades en alquiler: inmuebles, inquilinos, contratos, cobros y pagos. App móvil (iOS y Android) con Expo y backend en Supabase.

- **Documentación:** [`docs/`](docs/README.md) — plan de producto, arquitectura (TAD), Design System y decisiones (ADR).
- **Estado:** Fase 1 en desarrollo.

## Qué hay construido

| Área | Estado |
|---|---|
| Base de datos de la Fase 1 (esquema, RLS, funciones, Storage) | ✅ Probada: 55 pruebas pgTAP en PostgreSQL local |
| Registro, inicio de sesión y creación de la organización | 🟡 Implementado; falta probarlo contra un proyecto real de Supabase |
| Inicio del arrendador (dirección Billetera) | 🟡 Implementado; la vista está verificada con datos de ejemplo |
| Inmuebles: listar y registrar | 🟡 Implementado |
| Inquilinos: listar, registrar e invitar con enlace para compartir | 🟡 Implementado |
| Aceptar invitación y portal del inquilino (su contrato) | 🟡 Implementado |
| Contratos: asistente para crear, renovar y terminar | ⏳ Siguiente paso (la base de datos ya lo soporta) |
| Fotos y documentos, edición y archivado | ⏳ |
| Cobros y pagos | Fase 2 |

🟡 = compila, pasa tipos y lint, y su lógica pura tiene pruebas, pero aún no se ha ejecutado de extremo a extremo con un backend real ni en un teléfono.

## Requisitos

- Node.js 22
- Un proyecto de [Supabase](https://supabase.com) (plan gratuito para desarrollo)
- Para probar en el celular: una *development build* (`npx expo run:android` / `npx expo run:ios` o EAS Build)

## Puesta en marcha

```bash
npm install
cp .env.example .env        # completa la URL y la clave pública de tu proyecto de Supabase
```

Aplica la base de datos a tu proyecto (una sola vez, y cada vez que haya migraciones nuevas):

```bash
npx supabase login
npx supabase link --project-ref TU-PROYECTO
npx supabase db push
```

En el panel de Supabase, en **Authentication → URL Configuration**, agrega `domzli://**` a las URL de redirección.

Arranca la app:

```bash
npx expo start
```

## Comandos

| Comando | Qué hace |
|---|---|
| `npm run typecheck` | Verifica los tipos de TypeScript |
| `npm run lint` | ESLint |
| `npm test` | Pruebas unitarias (Vitest): dinero, fechas y reglas de dominio |
| `npm run test:db` | Aplica las migraciones en un PostgreSQL local y ejecuta las pruebas pgTAP de seguridad |
| `npm run tokens:build` | Regenera `src/theme/global.css` y `tokens.generated.ts` desde `docs/design-system/tokens.json` |
| `npm run tokens:check` | Falla si los tokens generados están desactualizados |

`npm run test:db` necesita PostgreSQL 15+ con la extensión `pgtap`. Con Docker, la vía oficial es `npx supabase start && npx supabase test db`.

## Estructura

```text
docs/                 Plan, arquitectura, Design System y decisiones
supabase/migrations/  Esquema, RLS, funciones y Storage (SQL versionado)
supabase/tests/       Pruebas pgTAP de aislamiento, invitaciones y contratos
src/app/              Rutas (Expo Router): (auth), (landlord), (tenant), invite
src/components/ui/    Design System: componentes base y de la dirección Billetera
src/features/         Módulos por funcionalidad: dominio, API, hooks y pantallas
src/lib/              Supabase, dinero, fechas y errores
src/theme/            Estilos generados desde los tokens
```

## Reglas del proyecto

- **La seguridad vive en la base de datos.** Toda tabla tiene RLS; la interfaz no es un mecanismo de autorización.
- **Los montos se manejan en centavos enteros** en el cliente (`src/lib/money.ts`) y los saldos los calcula la base de datos.
- **Las fechas de negocio son cadenas `YYYY-MM-DD`** (`src/lib/dates.ts`); nunca `new Date('YYYY-MM-DD')`.
- **Ningún color ni tamaño a mano:** todo sale de los tokens del Design System.
- `src/types/database.ts` es provisional: al tener el proyecto de Supabase, regenéralo con `npx supabase gen types typescript --linked > src/types/database.ts`.

El muestrario de componentes está en la ruta `/catalog` (modo desarrollo, o con `EXPO_PUBLIC_ENABLE_CATALOG=1`).
