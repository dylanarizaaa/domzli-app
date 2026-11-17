import { z } from 'zod';

export const tenantFormSchema = z.object({
  fullName: z.string().trim().min(2, 'Escribe el nombre completo.').max(160, 'Máximo 160 caracteres.'),
  documentType: z.enum(['CC', 'CE', 'PA', 'PPT', 'NIT']),
  documentNumber: z.string().trim().min(3, 'Escribe el número de documento.').max(30, 'Máximo 30 caracteres.'),
  email: z.string().trim().refine((v) => v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Escribe un correo válido, por ejemplo juan@correo.com.'),
  phone: z.string().trim().refine((v) => v === '' || /^[\d\s+()-]{7,20}$/.test(v), 'Escribe un teléfono válido, por ejemplo 300 123 4567.'),
});

export type TenantFormValues = z.infer<typeof tenantFormSchema>;

export const tenantFormDefaults: TenantFormValues = { fullName: '', documentType: 'CC', documentNumber: '', email: '', phone: '' };
