import { z } from 'zod';

const email = z.string().trim().min(1, 'Escribe tu correo.').regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Escribe un correo válido, por ejemplo ana@correo.com.');

export const signInSchema = z.object({
  email,
  password: z.string().min(1, 'Escribe tu contraseña.'),
});
export type SignInValues = z.infer<typeof signInSchema>;

export const signUpSchema = z.object({
  fullName: z.string().trim().min(2, 'Escribe tu nombre completo.'),
  email,
  password: z.string().min(8, 'Usa al menos 8 caracteres.'),
  consent: z.boolean().refine((v) => v, 'Debes autorizar el tratamiento de tus datos para crear la cuenta.'),
});
export type SignUpValues = z.infer<typeof signUpSchema>;

/** Versión vigente de la autorización de tratamiento de datos (Ley 1581 de 2012). */
export const DATA_CONSENT_VERSION = '2026-11';
