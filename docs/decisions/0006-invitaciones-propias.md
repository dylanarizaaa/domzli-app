# ADR-0006: Invitaciones con tabla propia y token de un solo uso ligado al correo

- **Estado:** Propuesta
- **Fecha:** 2026-11-17
- **Relacionado con:** TAD §7.5

## Contexto
El arrendador invita al inquilino por correo (plan §10.3). Un mismo inquilino puede arrendar a varios propietarios y ya tener cuenta en Domzli. La aceptación debe vincular su usuario con la ficha administrativa y crear su membresía.

## Decisión
- Tabla `invitations` con `token_hash` (SHA-256 de un token aleatorio de 32 bytes), vigencia de 7 días, estado y vínculo con `tenants`.
- La Edge Function `send-invitation` llama a `create_invitation` **con el JWT del arrendador** y envía el correo con el proveedor transaccional.
- `accept_invitation(token)` exige que el correo **verificado** del usuario coincida con el invitado; crea la membresía `tenant` y fija `tenants.profile_id`.
- `get_invitation_preview(token)` (anónima) devuelve solo la organización y el correo enmascarado.

## Alternativas consideradas
- **`auth.admin.inviteUserByEmail`.** Falla si el usuario ya existe y crea cuentas antes de que acepten.
- **Código numérico que el inquilino escribe.** Menos fricción técnica, pero más vulnerable a fuerza bruta y peor experiencia.

## Consecuencias
- ✅ Funciona con usuarios nuevos y existentes; trazable y revocable.
- ✅ El token en claro nunca se almacena.
- ⚠️ El token pendiente debe sobrevivir al registro y a la confirmación de correo (se guarda en almacenamiento seguro del dispositivo).
