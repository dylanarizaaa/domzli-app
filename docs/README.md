# Documentación de Domzli

| Documento | Contenido | Estado |
|---|---|---|
| [Plan de producto v2.0](product/plan-producto-v2.md) | Visión, alcance, módulos, roadmap y decisiones pendientes | Fuente |
| [Documento de Arquitectura Técnica (TAD)](architecture/TAD.md) | Diagramas C4, componentes, autenticación, seguridad RLS, modelo entidad-relación, flujos, despliegue y recomendaciones sobre decisiones pendientes | Propuesto |
| [Especificación del Design System](design-system/design-system-spec.md) | Principios, tokens (color, tipografía, espaciado), componentes base, de dominio y de la dirección Billetera, patrones móvil y web, accesibilidad y contenido | v1.1 · dirección visual aprobada |
| [Tokens del Design System](design-system/tokens.json) | Exportación de los tokens publicados en «Domzli UI»: fuente para `src/theme/tokens.ts` | Aprobado |
| [Registro de decisiones (ADR)](decisions/README.md) | 15 decisiones técnicas con contexto, alternativas y consecuencias | 4 aceptadas · 11 propuestas |

## Antes de iniciar la Fase 1

1. Revisar y aprobar el TAD y la especificación del Design System (o pedir cambios).
2. Pasar a "Aceptada" los ADR 0004–0014, o reemplazarlos.
3. Cerrar las decisiones pendientes que bloquean la Fase 1: **P-3** (participantes), **P-5** (documentos), **P-8** (*spike* de Expo Web), **P-10** (proveedor de correo), **P-12** (depósitos) y **P-13** (prórroga). Ver [TAD §16](architecture/TAD.md#16-decisiones-de-negocio-pendientes-recomendación-técnica).
4. Solicitar la validación jurídica de los puntos marcados con ⚖️.

Los diagramas están escritos en [Mermaid](https://mermaid.js.org/) y GitHub los muestra directamente.

## Referencias visuales publicadas

Artefactos privados de claude.ai (se comparten desde su menú Compartir):

- [Design System «Domzli UI»](https://claude.ai/artifact/Gj2FkdB6pDUBzHmZR829jm): tokens en ambos temas, guía de marca y 35 componentes con vista previa en vivo.
- [Lienzo «Domzli · Inicio móvil»](https://claude.ai/artifact/J5FLLzLEBaBbWwhUFX4khw): las cuatro direcciones exploradas; la **D · Billetera** es la aprobada.
