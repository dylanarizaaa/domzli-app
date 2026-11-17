# Documentación de Domzli

| Documento | Contenido | Estado |
|---|---|---|
| [Plan de producto v2.0](product/plan-producto-v2.md) | Visión, alcance, módulos, roadmap y decisiones pendientes | Fuente |
| [Documento de Arquitectura Técnica (TAD)](architecture/TAD.md) | Diagramas C4, componentes, autenticación, seguridad RLS, modelo entidad-relación, flujos, despliegue y recomendaciones sobre decisiones pendientes | Propuesto |
| [Especificación del Design System](design-system/design-system-spec.md) | Principios, tokens (color, tipografía, espaciado), componentes base, de dominio y de la dirección Billetera, patrones móvil y web, accesibilidad y contenido | v1.1 · dirección visual aprobada |
| [Tokens del Design System](design-system/tokens.json) | Exportación de los tokens publicados en «Domzli UI»: fuente para `src/theme/tokens.ts` | Aprobado |
| [Registro de decisiones (ADR)](decisions/README.md) | 15 decisiones técnicas con contexto, alternativas y consecuencias | 4 aceptadas · 11 propuestas |

## Estado

- **Fases 1 y 2 implementadas** (contratos, cobros y pagos). Las decisiones P-3, P-5, P-8, P-10, P-12 y P-13 están cerradas ([TAD §16.1](architecture/TAD.md#161-decisiones-cerradas-por-el-propietario-del-producto-17-nov-2026)); P-1, P-2, P-4, P-11 y P-14 se aplicaron según la recomendación técnica ([TAD §16.2](architecture/TAD.md#162-decisiones-aplicadas-en-la-fase-2-según-la-recomendación-técnica)).
- Pendiente antes de salir a usuarios reales: validación jurídica de los puntos marcados con ⚖️ (reajustes por IPC y mora, entre otros) y elección del proveedor de correo (P-10).
- Fase 3 (pasarela de pago, correos y push) depende de P-7 y P-10.

Los diagramas están escritos en [Mermaid](https://mermaid.js.org/) y GitHub los muestra directamente.

## Referencias visuales publicadas

Artefactos privados de claude.ai (se comparten desde su menú Compartir):

- [Design System «Domzli UI»](https://claude.ai/artifact/Gj2FkdB6pDUBzHmZR829jm): tokens en ambos temas, guía de marca y 35 componentes con vista previa en vivo.
- [Lienzo «Domzli · Inicio móvil»](https://claude.ai/artifact/J5FLLzLEBaBbWwhUFX4khw): las cuatro direcciones exploradas; la **D · Billetera** es la aprobada.
