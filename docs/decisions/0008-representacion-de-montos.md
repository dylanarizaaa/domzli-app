# ADR-0008: Montos `numeric(14,2)`; cálculo autoritativo en la base de datos

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §6.4, §9.1

## Contexto
El plan exige precisión decimal y evitar operaciones monetarias con punto flotante. La moneda inicial es COP, que en la práctica no usa centavos.

## Decisión
- PostgreSQL: `numeric(14,2)` con `CHECK` de no negatividad. La moneda se define por organización (`currency = 'COP'`).
- Los saldos (`total_amount`, `paid_amount`, `balance`) **se calculan solo en la base de datos**.
- Cliente: cada monto recibido se convierte a **centavos enteros** (`Math.round(value * 100)`) y solo se suman o restan enteros. La UI muestra pesos sin decimales con `Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })`.
- Prorrateos y redondeos (al peso, mitad hacia arriba) se hacen en SQL.

## Alternativas consideradas
- **`bigint` en centavos en la base de datos.** Evita decimales, pero las consultas y reportes SQL son menos legibles.
- **Librería decimal en el cliente (`big.js`, `dinero.js`).** Innecesaria si el cliente no calcula saldos con autoridad.

## Consecuencias
- ✅ Sin errores de redondeo en saldos.
- ✅ Los montos de 14 dígitos están muy por debajo del límite de enteros seguros de JavaScript.
- ⚠️ PostgREST serializa `numeric` como número JSON; el cliente debe pasar siempre por `lib/money`.
