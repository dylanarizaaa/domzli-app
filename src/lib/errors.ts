/** Error único de la app (TAD §6.6): traduce errores de Supabase a mensajes en español. */
export type AppErrorKind =
  | 'network' | 'unauthenticated' | 'forbidden' | 'business' | 'conflict' | 'validation' | 'not_found' | 'unexpected';

export class AppError extends Error {
  constructor(
    public readonly kind: AppErrorKind,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/** Códigos de máquina que lanzan las funciones de la base de datos. */
const BUSINESS_MESSAGES: Record<string, string> = {
  ORGANIZATION_NAME_REQUIRED: 'Escribe el nombre de tu organización (mínimo 2 caracteres).',
  TENANT_NOT_FOUND: 'No encontramos al inquilino.',
  TENANT_ARCHIVED: 'Este inquilino está archivado.',
  TENANT_ALREADY_LINKED: 'Este inquilino ya tiene acceso a la app.',
  TENANT_EMAIL_REQUIRED: 'Agrega un correo válido al inquilino para poder invitarlo.',
  TENANT_PROFILE_LINK_FORBIDDEN: 'El acceso del inquilino se activa cuando acepta la invitación.',
  INVITATION_NOT_FOUND: 'La invitación no existe o el enlace es incorrecto.',
  INVITATION_NOT_PENDING: 'Esta invitación ya fue usada o cancelada. Pide una nueva al arrendador.',
  INVITATION_EXPIRED: 'La invitación venció. Pide una nueva al arrendador.',
  INVITATION_EMAIL_MISMATCH: 'Esta invitación es para otro correo. Inicia sesión con el correo invitado.',
  EMAIL_NOT_VERIFIED: 'Confirma tu correo antes de aceptar la invitación.',
  ALREADY_STAFF_MEMBER: 'Ya administras esta organización con este usuario.',
  LEASE_NOT_FOUND: 'No encontramos el contrato.',
  LEASE_NOT_DRAFT: 'Este contrato ya no es un borrador.',
  LEASE_NOT_ACTIVE: 'El contrato no está vigente.',
  LEASE_REQUIRES_ONE_TENANT: 'El contrato necesita un inquilino antes de activarse.',
  PROPERTY_ARCHIVED: 'El inmueble está archivado.',
  PROPERTY_NOT_AVAILABLE: 'El inmueble no está disponible: ya tiene un contrato vigente o está en mantenimiento.',
  PROPERTY_HAS_ACTIVE_LEASE: 'El inmueble tiene un contrato vigente. Termínalo antes de cambiar su estado.',
  PROPERTY_NOT_LEASED: 'Un inmueble pasa a Arrendado al activar su contrato.',
  INVALID_END_DATE: 'La nueva fecha final debe ser posterior a la actual y a hoy.',
  INVALID_TERMINATION_DATE: 'La fecha de terminación debe estar entre el inicio del contrato y hoy.',
  TERMINATION_REASON_REQUIRED: 'Escribe el motivo de la terminación.',
  FORBIDDEN: 'No tienes permiso para hacer esto.',
  UNAUTHENTICATED: 'Tu sesión terminó. Inicia sesión de nuevo.',
};

const AUTH_MESSAGES: Record<string, string> = {
  invalid_credentials: 'Correo o contraseña incorrectos.',
  email_not_confirmed: 'Confirma tu correo antes de iniciar sesión. Revisa tu bandeja de entrada.',
  user_already_exists: 'Ya existe una cuenta con este correo. Inicia sesión.',
  email_exists: 'Ya existe una cuenta con este correo. Inicia sesión.',
  weak_password: 'La contraseña es muy débil. Usa al menos 8 caracteres.',
  over_email_send_rate_limit: 'Enviamos demasiados correos. Espera unos minutos e inténtalo de nuevo.',
  over_request_rate_limit: 'Demasiados intentos. Espera unos minutos.',
  same_password: 'La nueva contraseña debe ser distinta de la anterior.',
};

type ErrorLike = { message?: unknown; code?: unknown; status?: unknown; name?: unknown };

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  const e = (typeof error === 'object' && error !== null ? error : {}) as ErrorLike;
  const message = typeof e.message === 'string' ? e.message : '';
  const code = typeof e.code === 'string' ? e.code : undefined;
  const status = typeof e.status === 'number' ? e.status : undefined;

  if (message in BUSINESS_MESSAGES) {
    const kind: AppErrorKind = message === 'FORBIDDEN' ? 'forbidden' : message === 'UNAUTHENTICATED' ? 'unauthenticated' : 'business';
    return new AppError(kind, BUSINESS_MESSAGES[message], message);
  }
  if (code && code in AUTH_MESSAGES) return new AppError('validation', AUTH_MESSAGES[code], code);
  if (/network request failed|failed to fetch|networkerror|load failed/i.test(message) || e.name === 'AuthRetryableFetchError') {
    return new AppError('network', 'No hay conexión. Revisa tu internet e inténtalo de nuevo.', code);
  }
  if (status === 401 || code === 'PGRST301') return new AppError('unauthenticated', BUSINESS_MESSAGES.UNAUTHENTICATED, code);
  if (code === '42501') return new AppError('forbidden', BUSINESS_MESSAGES.FORBIDDEN, code);
  if (code === '23505') return new AppError('conflict', 'Ya existe un registro con esos datos.', code);
  if (code === '23514' || code === '23502' || code === '22P02') {
    return new AppError('validation', 'Hay datos que no son válidos. Revísalos e inténtalo de nuevo.', code);
  }
  if (code === 'PGRST116' || code === 'P0002') return new AppError('not_found', 'No encontramos lo que buscabas.', code);
  return new AppError('unexpected', 'Algo salió mal. Inténtalo de nuevo.', code);
}
