# ADR-0009: Design System propio sobre NativeWind con variantes `cva`

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** [Especificación del Design System](../design-system/design-system-spec.md)

## Contexto
El plan pide un Design System propio inspirado en shadcn/ui, compatible con móvil y web, sin usar shadcn/ui directamente.

## Decisión
- Estilos con **NativeWind** y tokens expuestos como variables CSS (`rgb(var(--color-…) / <alpha-value>)`).
- Variantes con **`class-variance-authority` (cva)** y combinación de clases con `clsx` + `tailwind-merge` (`cn()`), igual que shadcn/ui.
- Primitivas accesibles sin estilos (`@rn-primitives/*`) para diálogos, menús, selects y tooltips, cuando aporten accesibilidad y manejo de foco.
- Modelo **"copiar, no depender"**: los componentes viven en `src/components/ui` y se pueden adaptar libremente. React Native Reusables puede servir como punto de partida para copiar código, no como dependencia.

## Alternativas consideradas
- **Tamagui o Gluestack UI.** Completos, pero imponen su propio sistema de estilos y su API.
- **React Native Paper.** Atado a Material Design; choca con la identidad minimalista buscada.
- **Componentes desde cero sin primitivas.** Reimplementar foco, trampas de foco y ARIA en web es costoso y propenso a errores.

## Consecuencias
- ✅ Control total sobre la identidad visual y las variantes; API familiar para quien conoce shadcn/ui.
- ✅ Los tokens son la única fuente de color, espaciado y tipografía.
- ⚠️ El mantenimiento de los componentes es del equipo.
- ⚠️ Hay que vigilar la compatibilidad entre versiones de NativeWind, Tailwind y Expo SDK.
