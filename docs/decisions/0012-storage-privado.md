# ADR-0012: Storage privado con rutas por organización y URLs firmadas

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §8.6

## Contexto
Contratos, comprobantes y fotos de inmuebles contienen datos personales o sensibles (incluidas fotos del interior de viviendas con dirección conocida). El plan exige buckets privados, URLs firmadas con vencimiento y RLS en Storage.

## Decisión
- Buckets **privados**: `property-photos`, `lease-documents`, `payment-receipts` y `expense-receipts` (F3).
- Ruta con prefijo de organización: `{organization_id}/{entidad}/{id}/{uuid}.{ext}`. Las políticas sobre `storage.objects` usan `storage.foldername(name)` comparando como texto.
- URLs firmadas de 5 minutos para documentos y comprobantes, y de 1 hora para fotos.
- Límites de tamaño y tipos MIME por bucket; los comprobantes y contratos son inmutables (sin `UPDATE` ni `DELETE`).

## Alternativas consideradas
- **Bucket público para fotos.** Más simple y cacheable, pero expone imágenes de viviendas a cualquiera que obtenga la URL.

## Consecuencias
- ✅ Autorización uniforme entre datos y archivos.
- ⚠️ Las URLs firmadas complican el caché de imágenes: se usa `expo-image` con clave de caché por ruta, no por URL.
- ⚠️ Los respaldos de la base de datos no incluyen los archivos: se requiere una copia externa (TAD §13).
