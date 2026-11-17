# ADR-0001: Cliente único multiplataforma con Expo, Expo Router y React Native Web

- **Estado:** Aceptada (definida en el plan v2.0)
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §4, §6.8 · Decisión pendiente P-8

## Contexto
Domzli necesita apps para Android, iOS y Web con un equipo pequeño. La web prioriza la administración de escritorio (tablas, gestión masiva), mientras que el móvil es la experiencia principal.

## Decisión
Una sola base de código TypeScript con **Expo** (última SDK estable), **Expo Router** (navegación por archivos) y **React Native Web**. Las diferencias por plataforma se resuelven con archivos `.web.tsx` / `.native.tsx` y con el hook `useBreakpoint()`, no con bifurcaciones del proyecto.

## Alternativas consideradas
- **React Native para móvil + Next.js para web.** Mejor SEO y ecosistema web, pero duplica pantallas, navegación y parte de la UI. Queda como evolución si se necesita una web pública con SEO; el backend no cambiaría.
- **Flutter.** Buen rendimiento multiplataforma, pero sale del ecosistema TypeScript y de `supabase-js`.
- **PWA únicamente.** Menor costo, pero peor experiencia en iOS (notificaciones, cámara, almacenamiento seguro) y sin presencia en las tiendas.

## Consecuencias
- ✅ Un solo equipo, un solo lenguaje, lógica y componentes compartidos.
- ✅ EAS Build y EAS Update simplifican la distribución y las correcciones rápidas.
- ⚠️ Algunos componentes administrativos de web (tablas, selectores de fecha, navegación con teclado) requieren implementaciones específicas. Se valida con un *spike* en la Fase 1.
- ⚠️ La web es una SPA sin SEO; aceptable porque es una aplicación autenticada.
