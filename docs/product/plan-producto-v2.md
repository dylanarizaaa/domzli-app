# Domzli · Plan de producto y arquitectura

| Campo | Valor |
|---|---|
| Versión | 2.0 |
| Fecha | Noviembre de 2026 |
| Mercado inicial | Colombia |
| Modelo de negocio | Freemium / SaaS por suscripción (evolutivo) |
| Plataformas | Android, iOS y Web |

> Documento fuente del producto. Las decisiones técnicas derivadas están en el [TAD](../architecture/TAD.md), la [especificación del Design System](../design-system/design-system-spec.md) y los [ADR](../decisions/README.md). Los ajustes propuestos a este plan se listan en el [TAD, §18](../architecture/TAD.md#18-cambios-propuestos-respecto-al-plan-v20).

---

## 1. Visión del producto

Domzli es una plataforma digital para la administración integral de propiedades en alquiler. Su objetivo es centralizar la gestión inmobiliaria, contractual y financiera en un único ecosistema, conectando propietarios, administradores, inmobiliarias e inquilinos.

La plataforma permitirá gestionar el ciclo de vida de un inmueble arrendado: desde su registro y publicación administrativa hasta la formalización del contrato, generación de cobros, recepción de pagos y seguimiento financiero.

### 1.1. Objetivos

- Simplificar la administración de inmuebles.
- Centralizar contratos y documentación.
- Automatizar la generación de cobros mensuales.
- Facilitar el registro y seguimiento de pagos.
- Proporcionar información financiera sobre cada propiedad.
- Mejorar la comunicación entre arrendadores e inquilinos.
- Permitir que inmobiliarias administren múltiples propiedades y usuarios.
- Construir una plataforma escalable y comercializable como SaaS.

### 1.2. Propuesta de valor

Domzli no debe limitarse a ser un registro digital de arrendamientos. Debe convertirse en una herramienta que permita conocer en todo momento el estado administrativo y financiero de cada propiedad.

**Para los propietarios:**

- Control de sus inmuebles.
- Seguimiento de contratos.
- Control de ingresos y gastos.
- Identificación de cartera pendiente.
- Historial de pagos.
- Indicadores de rentabilidad.

**Para los inquilinos:**

- Consulta de su contrato.
- Visualización de obligaciones económicas.
- Reporte de pagos.
- Consulta de comprobantes e historial.
- Acceso a documentos y notificaciones.

**Para las inmobiliarias:**

- Administración centralizada de propiedades.
- Gestión de empleados y permisos.
- Supervisión de contratos.
- Reportes consolidados.
- Administración de múltiples propietarios e inquilinos.

---

## 2. Público objetivo y estrategia comercial

Domzli tendrá dos segmentos principales.

### 2.1. Propietarios individuales

Personas que poseen una o varias propiedades y administran directamente sus arrendamientos. Este será el público inicial para validar el producto.

### 2.2. Inmobiliarias y administradores profesionales

Empresas o personas que administran inmuebles de terceros y necesitan centralizar operaciones, empleados, contratos y finanzas. Este segmento permitirá evolucionar hacia una plataforma SaaS.

### 2.3. Estrategia de comercialización

La comercialización será progresiva.

**Etapa inicial: uso personal**

- Validación de funcionalidades.
- Administración de propiedades propias.
- Incorporación de inquilinos.
- Validación del flujo de pagos.
- Identificación de oportunidades de mejora.

**Etapa de crecimiento: producto comercial**

- Registro de propietarios.
- Planes gratuitos y de pago.
- Límites por cantidad de propiedades.
- Funcionalidades premium.
- Gestión de suscripciones.

**Etapa empresarial: SaaS**

- Registro de inmobiliarias.
- Organizaciones independientes.
- Administración de empleados.
- Roles y permisos configurables.
- Reportes empresariales.
- Planes personalizados.

Los precios y límites comerciales se definirán después de validar el producto.

---

## 3. Plataformas y experiencia de usuario

Domzli tendrá tres experiencias:

1. Aplicación móvil para Android.
2. Aplicación móvil para iOS.
3. Aplicación web responsive.

El desarrollo será mobile-first: las funcionalidades principales se diseñarán inicialmente para dispositivos móviles, considerando posteriormente su adaptación a pantallas de escritorio.

### 3.1. Aplicación del arrendador

Navegación principal: Inicio · Inmuebles · Inquilinos · Contratos · Finanzas · Cuenta.

**Dashboard**

Indicadores principales:

- Total de inmuebles.
- Inmuebles arrendados.
- Inmuebles disponibles.
- Ingresos del período.
- Pagos pendientes.
- Cartera vencida.

Accesos rápidos:

- Registrar inmueble.
- Registrar inquilino.
- Crear contrato.
- Registrar pago.

**Inmuebles**

Listado de propiedades con: fotografía principal, nombre o identificación, dirección, estado, canon vigente e inquilino asociado.

Detalle del inmueble: información general, características, fotografías, contrato activo, historial de arrendamientos, ingresos y gastos, documentación.

**Inquilinos**

- Listado de inquilinos.
- Información personal y de contacto.
- Contratos asociados.
- Estado de vinculación.
- Historial de pagos.

**Contratos**

- Contratos activos.
- Contratos próximos a vencer.
- Contratos finalizados.
- Creación y edición.
- Documentos adjuntos.
- Historial de modificaciones.
- Renovación y finalización.

**Finanzas**

- Resumen de ingresos.
- Cobros pendientes.
- Pagos recibidos.
- Pagos en revisión.
- Cartera vencida.
- Gastos.
- Rentabilidad por inmueble.

### 3.2. Aplicación del inquilino

Navegación principal: Inicio · Mi contrato · Pagos · Documentos · Cuenta.

**Dashboard:** canon del período, próximo vencimiento, total pendiente, último pago reportado, estado de cuenta.

**Mi contrato:** información del inmueble, condiciones económicas, fecha de inicio y finalización, canon mensual, administración, documento contractual.

**Pagos:** obligaciones pendientes, historial, reportar pago, adjuntar comprobante, consultar aprobación o rechazo.

**Documentos:** contrato, comprobantes, recibos disponibles, documentación compartida.

### 3.3. Aplicación web

La versión web compartirá los módulos y servicios principales con la aplicación móvil.

Se priorizará una experiencia administrativa de escritorio para:

- Tablas con filtros y ordenamiento.
- Gestión masiva de propiedades.
- Administración de contratos.
- Reportes financieros.
- Exportación de información.
- Gestión de empleados y permisos.

No se desarrollará un segundo backend para la versión web.

---

## 4. Alcance funcional y módulos

### 4.1. MVP: funcionalidades principales

El MVP estará compuesto por dos grandes entregas.

**Fase 1: administración**

- Registro e inicio de sesión.
- Roles de arrendador e inquilino.
- Organizaciones.
- Inmuebles.
- Inquilinos.
- Contratos.
- Invitaciones por correo.
- Documentación.

**Fase 2: gestión financiera**

- Generación mensual de cobros.
- Reporte de pagos.
- Carga de comprobantes.
- Aprobación y rechazo.
- Pagos parciales.
- Historial financiero.
- Dashboard de ingresos y cartera.

### 4.2. Funcionalidades posteriores

**Fase 3: automatización y servicios**

- Servicios públicos.
- Gastos de mantenimiento.
- Solicitudes de reparación.
- Notificaciones push.
- Recordatorios automáticos.
- Pasarela de pagos.
- Integración de facturación electrónica cuando corresponda.

**Fase 4: comercialización SaaS**

- Registro de organizaciones.
- Suscripciones.
- Planes.
- Gestión de empleados.
- Permisos avanzados.
- Panel de administración empresarial.
- Métricas de uso.

---

## 5. Arquitectura tecnológica

La arquitectura estará basada en un ecosistema TypeScript, priorizando modularidad, reutilización y separación de responsabilidades.

### 5.1. Stack principal

**Frontend**

- React Native: framework de desarrollo móvil.
- Expo: entorno de desarrollo y herramientas nativas.
- Expo Router: navegación basada en archivos.
- React Native Web: adaptación de componentes compatibles al navegador.
- TypeScript: tipado estático.

**UI y estilos**

- NativeWind: estilización mediante utilidades similares a Tailwind CSS.
- Lucide React Native: iconografía.
- Componentes propios inspirados en shadcn/ui.
- Design Tokens: sistema centralizado de diseño.

**Gestión de datos**

- TanStack Query: caché, consultas y mutaciones.
- React Hook Form: formularios.
- Zod: validaciones.
- Zustand: estado global de interfaz cuando sea necesario.

**Backend**

- Supabase Auth: autenticación.
- PostgreSQL: persistencia relacional.
- Supabase Storage: documentos y archivos.
- Supabase Edge Functions: operaciones de servidor e integraciones.
- Row Level Security: autorización a nivel de base de datos.

**Calidad y despliegue**

- Vitest: pruebas unitarias.
- React Native Testing Library: pruebas de componentes.
- EAS Build: compilación móvil.
- EAS Update: distribución de actualizaciones compatibles.
- Supabase CLI: migraciones y versionamiento de base de datos.
- Git: control de versiones.

### 5.2. Estrategia de desarrollo multiplataforma

Se utilizará Expo como base para Android, iOS y Web.

La aplicación tendrá una estructura compartida, pero permitirá adaptar la navegación y los componentes según el dispositivo. Se evitará asumir que todos los componentes móviles funcionan idénticamente en navegador. Para funcionalidades específicas se permitirán implementaciones diferenciadas por plataforma.

La versión web tendrá especial atención a:

- Navegación lateral.
- Tablas administrativas.
- Diseño responsive.
- Accesibilidad mediante teclado.
- Formularios de escritorio.
- Experiencia de administración.

Si en el futuro se necesita una web pública con necesidades importantes de SEO, se podrá incorporar Next.js sin modificar el backend ni duplicar las reglas de negocio.

---

## 6. Design System y componentes reutilizables

Domzli implementará un Design System propio inspirado en shadcn/ui. El objetivo es conseguir una interfaz minimalista, consistente, accesible y fácil de mantener.

No se utilizará shadcn/ui directamente como biblioteca de componentes móviles. Se tomarán sus principios de diseño, variantes, composición y personalización para construir componentes compatibles con React Native.

### 6.1. Identidad visual

- Diseño minimalista.
- Fondos claros.
- Tipografía legible.
- Bordes sutiles.
- Sombras discretas.
- Espaciados consistentes.
- Estados visuales claros.
- Componentes con variantes.
- Adaptación a modo oscuro como capacidad futura.

### 6.2. Componentes base

- **Formularios:** Input, Textarea, Select, Checkbox, Switch, Radio Group, Date Picker, Form Field.
- **Acciones:** Button, Icon Button, Dropdown Menu, Action Sheet.
- **Visualización:** Card, Badge, Avatar, Separator, Table, Tabs, Accordion, Skeleton, Empty State.
- **Feedback:** Toast, Alert, Dialog, Loading State, Error State.
- **Navegación:** Header, Sidebar, Bottom Navigation, Breadcrumb, Pagination.
- **Componentes de dominio:** Property Card, Tenant Card, Lease Card, Payment Card, Charge Summary, Financial Summary, Payment Status, Property Gallery.

### 6.3. Reglas de implementación

- Todos los componentes genéricos estarán centralizados.
- Las variantes visuales se definirán mediante propiedades.
- No se duplicarán estilos entre pantallas.
- Se utilizarán tokens de diseño.
- Los componentes de dominio podrán componerse a partir de los componentes base.
- Se evitará incorporar dependencias cuando un componente propio sencillo sea suficiente.
- Se mantendrá compatibilidad con móvil y web cuando corresponda.

---

## 7. Arquitectura de software

Se utilizará una arquitectura modular organizada por funcionalidades. La aplicación no dependerá directamente de las pantallas para ejecutar operaciones de negocio.

Las responsabilidades estarán separadas:

- **Presentación:** pantallas y componentes.
- **Aplicación:** casos de uso y orquestación.
- **Dominio:** reglas y entidades del negocio.
- **Infraestructura:** Supabase, almacenamiento e integraciones.

No es necesario implementar una arquitectura de microservicios. El backend comenzará como una solución modular sobre Supabase.

### 7.1. Estructura del repositorio

```text
domzli/
├── docs/
│   ├── product/
│   ├── architecture/
│   └── decisions/
│
├── supabase/
│   ├── migrations/
│   ├── functions/
│   └── seed.sql
│
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── (landlord)/
│   │   ├── (tenant)/
│   │   └── _layout.tsx
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   └── feedback/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── organizations/
│   │   ├── properties/
│   │   ├── tenants/
│   │   ├── leases/
│   │   ├── charges/
│   │   ├── payments/
│   │   ├── expenses/
│   │   └── reports/
│   │
│   ├── hooks/
│   ├── lib/
│   ├── providers/
│   ├── services/
│   ├── stores/
│   ├── schemas/
│   ├── constants/
│   └── types/
│
├── assets/
├── .env.example
├── app.json
└── package.json
```

Cada módulo dentro de `features` tendrá sus componentes, hooks, servicios, esquemas y tipos específicos cuando corresponda.

---

## 8. Modelo de datos

El contrato será la entidad central del dominio. Relacionará un inmueble con uno o varios participantes del arrendamiento y será el origen de las obligaciones económicas. El modelo estará preparado para múltiples organizaciones.

### 8.1. Tablas principales

| Tabla | Responsabilidad |
|---|---|
| `organizations` | Organizaciones y propietarios |
| `profiles` | Información de usuarios |
| `memberships` | Relación usuario-organización-rol |
| `properties` | Inmuebles |
| `tenants` | Información de inquilinos |
| `leases` | Contratos |
| `charges` | Obligaciones económicas |
| `charge_items` | Conceptos individuales de cada cobro |
| `payments` | Pagos reportados o recibidos |
| `payment_allocations` | Distribución de pagos entre cobros |
| `utility_bills` | Recibos de servicios públicos |
| `expenses` | Gastos de propiedades |
| `audit_logs` | Registro de operaciones importantes |
| `notifications` | Notificaciones |

### 8.2. Entidades y responsabilidades

- **organizations** — Representa una cuenta o entidad administradora. Campos: `id`, `name`, `tax_id`, `created_at`.
- **profiles** — Información del usuario. Campos: `id`, `full_name`, `email`, `phone`, `created_at`.
- **memberships** — Relación entre usuarios y organizaciones. Campos: `id`, `organization_id`, `user_id`, `role`, `status`. Roles iniciales: `owner`, `admin`, `tenant`.
- **properties** — Propiedades administradas. Campos: `id`, `organization_id`, `name`, `property_type`, `address`, `city`, `neighborhood`, `area`, `bedrooms`, `bathrooms`, `parking_spaces`, `administration_value`, `status`.
- **tenants** — Ficha administrativa del inquilino. Campos: `id`, `organization_id`, `profile_id`, `full_name`, `document_type`, `document_number`, `email`, `phone`.
- **leases** — Contratos. Campos: `id`, `organization_id`, `property_id`, `start_date`, `end_date`, `monthly_rent`, `administration_value`, `payment_day`, `deposit_amount`, `annual_increase_percentage`, `status`, `contract_document`.
- **charges** — Obligaciones económicas. Campos: `id`, `organization_id`, `lease_id`, `period`, `due_date`, `total_amount`, `paid_amount`, `status`.
- **charge_items** — Cada concepto del cobro. Campos: `id`, `charge_id`, `concept`, `description`, `amount`.
- **payments** — Pagos. Campos: `id`, `organization_id`, `amount`, `payment_date`, `payment_method`, `receipt_path`, `status`, `reviewed_by`, `reviewed_at`.
- **payment_allocations** — Distribución de un pago entre diferentes cobros. Campos: `id`, `payment_id`, `charge_id`, `allocated_amount`.
- **expenses** — Gastos asociados a una propiedad. Campos: `id`, `organization_id`, `property_id`, `category`, `description`, `amount`, `expense_date`, `receipt_path`.

Los importes se almacenarán con precisión decimal, evitando operaciones monetarias con números de punto flotante en la aplicación. La moneda inicial será COP.

### 8.3. Reglas de integridad

- Un inmueble no puede tener dos contratos activos simultáneamente.
- Los contratos, inmuebles e inquilinos deben pertenecer a la misma organización.
- Los cobros deben estar asociados a un contrato.
- No se deben generar dos cobros equivalentes para el mismo período contractual.
- Los pagos aprobados deben reflejarse en sus asignaciones.
- Los pagos rechazados no deben alterar los saldos.
- La finalización de un contrato no elimina su historial.
- Los documentos históricos deben conservarse según las políticas de retención.

La generación mensual de cobros se ejecutará en el backend, no desde el dispositivo móvil. Se implementarán restricciones de unicidad y operaciones transaccionales para evitar duplicaciones y problemas de concurrencia.

---

## 9. Seguridad y autorización

La seguridad estará implementada principalmente en PostgreSQL mediante Row Level Security. La interfaz no será considerada un mecanismo de autorización.

### 9.1. Reglas de acceso

**Arrendador:** administrar los inmuebles de su organización; crear y administrar inquilinos; crear y finalizar contratos; consultar cobros; revisar pagos; consultar reportes.

**Administrador:** acceder a las funcionalidades autorizadas por la organización; no modificar la propiedad de la organización; no gestionar suscripciones salvo permiso explícito.

**Inquilino:** consultar su contrato; consultar su inmueble; consultar sus obligaciones; reportar pagos; consultar su historial; actualizar sus datos permitidos.

### 9.2. Reglas adicionales

- Ningún usuario puede modificar su propio rol.
- Las membresías se administran mediante operaciones autorizadas.
- Los comprobantes y contratos estarán en buckets privados.
- Las URLs firmadas tendrán vencimiento.
- Las claves privilegiadas nunca estarán en el cliente.
- Los cambios financieros importantes quedarán auditados.
- Se validarán montos y saldos en el backend.
- Las políticas RLS deberán contemplar también las operaciones de Storage.

---

## 10. Flujos principales del negocio

### 10.1. Registro de un arrendador

1. El usuario se registra.
2. Se crea su perfil.
3. Se crea su organización.
4. Se crea una membresía con rol `owner`.
5. Se habilita el dashboard.
6. Puede comenzar a registrar propiedades.

### 10.2. Registro de un inmueble

1. El arrendador selecciona registrar inmueble.
2. Completa la información general.
3. Registra las características.
4. Adjunta fotografías.
5. Guarda el inmueble.
6. El inmueble queda disponible.

### 10.3. Vinculación de un inquilino

1. El arrendador registra los datos del inquilino.
2. Crea una invitación por correo.
3. Una Edge Function procesa la invitación.
4. El inquilino acepta.
5. Define sus credenciales.
6. Se vincula su usuario con la ficha y membresía correspondiente.

### 10.4. Creación de un contrato

1. Seleccionar un inmueble disponible.
2. Seleccionar un inquilino.
3. Registrar condiciones económicas.
4. Definir fechas.
5. Adjuntar el documento firmado.
6. Confirmar el contrato.
7. Actualizar el estado del inmueble.
8. Habilitar el acceso del inquilino.

### 10.5. Generación de cobros

1. El backend identifica contratos activos.
2. Determina los períodos que deben facturarse.
3. Calcula canon y administración.
4. Genera los conceptos del cobro.
5. Establece vencimientos.
6. Evita duplicaciones.
7. Publica la obligación en la cuenta del inquilino.

### 10.6. Reporte y aprobación de pagos

1. El inquilino selecciona un cobro.
2. Ingresa el monto.
3. Selecciona el método de pago.
4. Adjunta el comprobante.
5. El pago queda en revisión.
6. El arrendador revisa el soporte.
7. Aprueba o rechaza.
8. Si se aprueba, se actualiza el saldo correspondiente.
9. Se registra la operación en el historial.

La aprobación manual del comprobante no equivale a una confirmación bancaria. La verificación automática quedará reservada para la integración con pasarelas de pago.

---

## 11. Roadmap de implementación

Las fases se ejecutarán secuencialmente. Cada una tendrá entregables verificables antes de iniciar la siguiente.

### Fase 1 — Fundamentos y administración

**Objetivo:** disponer de una aplicación funcional para administrar inmuebles, inquilinos y contratos.

**Entregables:** configuración de Expo, TypeScript, Expo Router, NativeWind, Design System inicial, configuración de Supabase, modelo de organizaciones, membresías y perfiles, autenticación, RLS, gestión de inmuebles, gestión de inquilinos, gestión de contratos, invitaciones, documentación, navegación por rol.

**Criterio de aceptación:** un propietario puede registrar sus inmuebles, crear contratos e invitar a un inquilino, quien puede acceder exclusivamente a su información.

### Fase 2 — Cobros y pagos

**Objetivo:** gestionar las obligaciones económicas de los contratos.

**Entregables:** generación mensual de cobros, conceptos de cobro, pagos parciales, carga de comprobantes, aprobación y rechazo, distribución de pagos, historial financiero, dashboard, cartera pendiente, incrementos contractuales.

**Criterio de aceptación:** el arrendador puede controlar los cobros y el inquilino puede reportar sus pagos, con saldos consistentes y trazabilidad.

### Fase 3 — Automatización y servicios

**Objetivo:** reducir las tareas manuales y ampliar la gestión financiera.

**Entregables:** servicios públicos, gastos, mantenimiento, notificaciones, recordatorios, pasarela Wompi o PayU, confirmación de transacciones mediante webhooks, integración de facturación electrónica cuando corresponda.

**Criterio de aceptación:** los procesos recurrentes y las operaciones de pago pueden gestionarse con menor intervención manual.

### Fase 4 — SaaS y expansión

**Objetivo:** convertir Domzli en un producto comercial.

**Entregables:** registro de nuevas organizaciones, gestión de planes, suscripciones, límites de uso, administración de empleados, roles y permisos, panel empresarial, métricas de utilización, reportes consolidados, herramientas de administración de plataforma.

**Criterio de aceptación:** una inmobiliaria puede registrarse, administrar sus propiedades y usuarios, y utilizar Domzli bajo un plan comercial.

---

## 12. Panel de administración de la plataforma

En la etapa SaaS se incorporará un panel interno para gestionar la operación comercial de Domzli. Este panel será independiente de la interfaz de arrendadores e inquilinos.

Funcionalidades: organizaciones registradas, usuarios activos, suscripciones, planes disponibles, estado de cuentas, métricas de utilización, gestión de soporte, auditoría de operaciones administrativas.

El acceso estará restringido a personal autorizado de Domzli.

---

## 13. Métricas de producto

Se medirán indicadores para entender el uso y la rentabilidad del producto.

- **Adopción:** usuarios registrados, propietarios activos, inquilinos vinculados, organizaciones activas.
- **Operación:** inmuebles registrados, contratos activos, cobros generados, pagos reportados, tiempo de aprobación de pagos.
- **Finanzas:** cartera pendiente, porcentaje de pagos realizados a tiempo, ingresos administrados, gastos registrados, rentabilidad por inmueble.
- **SaaS:** usuarios de pago, conversión de planes, retención, cancelaciones, ingreso recurrente mensual (MRR).

---

## 14. Requisitos no funcionales

- Seguridad por organización.
- Autorización en base de datos.
- Diseño responsive.
- Accesibilidad.
- Rendimiento en dispositivos de gama media.
- Manejo de errores.
- Registro de operaciones críticas.
- Migraciones versionadas.
- Pruebas automatizadas.
- Separación de ambientes.
- Respaldo y recuperación de datos.
- Gestión segura de archivos.
- Escalabilidad horizontal de los servicios administrados.

La aplicación deberá funcionar correctamente con conexiones inestables, especialmente durante la consulta de información. Las operaciones financieras no se confirmarán localmente sin validación del backend.

---

## 15. Decisiones técnicas y de negocio pendientes

Las siguientes decisiones deberán cerrarse antes de implementar los módulos correspondientes. La recomendación técnica para cada una está en el [TAD, §16](../architecture/TAD.md#16-decisiones-de-negocio-pendientes-recomendación-técnica).

1. **Administración:** determinar si el valor se incluye en el canon o se cobra como concepto independiente.
2. **Incrementos:** definir el tratamiento de incrementos contractuales y las reglas legales aplicables en Colombia.
3. **Participantes:** determinar si el MVP permitirá un solo inquilino principal o varios cotitulares por contrato.
4. **Pagos:** definir si se admitirán abonos y cómo se aplicarán a obligaciones anteriores.
5. **Documentación:** establecer las políticas de conservación y acceso a documentos.
6. **Facturación:** validar las obligaciones tributarias y el proveedor de integración.
7. **Pasarela:** comparar Wompi y PayU según costos, disponibilidad, conciliación y facilidad de integración.
8. **Web:** validar la cobertura de Expo Web y los componentes administrativos requeridos.
9. **Monetización:** definir planes, límites y funcionalidades premium después de validar el uso.
10. **Notificaciones:** definir proveedores de correo y notificaciones push.

---

## 16. Principios de desarrollo

1. Mobile-first, sin descuidar la experiencia web.
2. TypeScript en toda la aplicación.
3. Componentes reutilizables y composición.
4. Separación de lógica de negocio y presentación.
5. Validaciones compartidas mediante esquemas.
6. Seguridad implementada en el backend.
7. Migraciones de base de datos versionadas.
8. Operaciones financieras transaccionales.
9. Historial de operaciones importantes.
10. Evitar complejidad arquitectónica innecesaria.
11. Diseñar para SaaS sin implementar anticipadamente funcionalidades comerciales.
12. Cada fase debe entregar una funcionalidad utilizable y verificable.

---

## 17. Resultado esperado

Domzli evolucionará desde una herramienta de administración personal hacia una plataforma SaaS para la gestión integral de propiedades en alquiler.

El desarrollo comenzará con un producto funcional para propietarios individuales, permitiendo administrar inmuebles, contratos, inquilinos y pagos. Posteriormente se incorporarán automatizaciones, servicios financieros, integraciones externas y herramientas empresariales.

La arquitectura permitirá compartir la lógica de negocio, los servicios y los componentes compatibles entre dispositivos móviles y web, manteniendo una experiencia de usuario consistente y una base tecnológica preparada para crecer.

**Visión final:** Domzli, todo lo que necesitas para administrar tus propiedades en un solo lugar.
