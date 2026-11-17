# ADR-0015: Dirección visual "Billetera digital" para las pantallas de inicio

- **Estado:** Aceptada (aprobada por el propietario del producto el 17 nov 2026)
- **Fecha:** 2026-11-17
- **Relacionado con:** [Especificación del Design System](../design-system/design-system-spec.md) §1, §3.3.1, §3.6, §5.11, §7.1–7.2 · ADR-0009

## Contexto

La primera versión del Design System era minimalista (plan §6.1: fondos claros, bordes sutiles, sombras discretas). Al verla aplicada al inicio del arrendador, el propietario del producto la consideró demasiado básica y poco diferencial frente a las apps actuales, y aportó como referencia el patrón de las billeteras digitales (e-wallet).

En un lienzo se compararon cuatro direcciones: A · Minimal, B · Nocturno, C · Bento y D · Billetera. Se aprobó la **D**.

## Decisión

Las pantallas de inicio (arrendador e inquilino) siguen el patrón **billetera digital / super-app**:

1. **`BalanceHeader`:** encabezado índigo en degradado con una cifra protagonista centrada.
2. **`ActionCard`:** tarjeta blanca flotante montada sobre el encabezado, con 3 o 4 acciones de dinero.
3. **`ModuleGrid`:** cuadrícula de módulos con iconos en cuadros de color de identidad.
4. **`HighlightCarousel`:** carrusel de tarjetas de color con lo que requiere atención.
5. **`TabBar`:** barra inferior con 4 destinos y un botón central elevado para crear.

Para soportarlo, el sistema incorpora:

- **Sora** como familia de cifras y títulos (Inter sigue para el texto).
- Radios `2xl` (20), `3xl` (24) y `4xl` (32).
- Tokens `hero-*`, `module-*` y `highlight-*`.
- Sombras `elevation-float` y `fab-shadow`.

El resto de la app (listados, formularios, detalles, tablas) conserva la base sobria del sistema: "expresivo donde importa".

## Alternativas consideradas

- **A · Minimal (v1.0).** Clara y fácil de mantener, pero percibida como genérica.
- **B · Nocturno.** Oscura, con tarjetas apiladas. Llamativa, pero adelanta el modo oscuro como identidad principal y reduce la legibilidad en exteriores, un caso frecuente en móvil.
- **C · Bento.** Mosaico de bloques de color. Moderna, pero menos familiar para el público objetivo que el patrón de billetera, que ya conocen por Nequi o Daviplata.

## Consecuencias

- ✅ Identidad más memorable y un patrón familiar para usuarios colombianos de billeteras digitales.
- ✅ El inicio funciona como lanzador de módulos: la barra inferior queda en 4 destinos + Crear, dentro de las guías de iOS y Android.
- ⚠️ Inmuebles e Inquilinos dejan de tener pestaña propia en móvil: hay que validarlo en pruebas con usuarios (alternativa documentada en §7.1).
- ⚠️ Más superficie visual que mantener: un degradado (solo en `BalanceHeader`), 16 tokens de módulo, 7 de destacados y una segunda familia tipográfica (~2 pesos adicionales en el binario).
- ⚠️ Los colores `module-*` y `highlight-*` son de identidad y no deben confundirse con los de estado; lo hacen cumplir las reglas del sistema y la revisión de diseño.
- ⚠️ `BalanceHeader` requiere `expo-linear-gradient` en nativo.
