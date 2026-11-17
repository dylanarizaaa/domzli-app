import { z } from 'zod';

const optionalInt = (max: number, message: string) =>
  z.string().trim().refine((v) => v === '' || (/^\d+$/.test(v) && Number(v) <= max), message);

/** Formulario de inmueble. Los campos numéricos se capturan como texto y se convierten al guardar. */
export const propertyFormSchema = z.object({
  name: z.string().trim().min(1, 'Escribe un nombre para reconocer el inmueble.').max(120, 'Máximo 120 caracteres.'),
  propertyType: z.enum(['apartment', 'house', 'studio', 'room', 'commercial', 'office', 'warehouse', 'lot', 'other']),
  address: z.string().trim().min(3, 'Escribe la dirección.'),
  city: z.string().trim().min(2, 'Escribe la ciudad.'),
  neighborhood: z.string().trim(),
  bedrooms: optionalInt(50, 'Escribe un número entre 0 y 50.'),
  bathrooms: optionalInt(50, 'Escribe un número entre 0 y 50.'),
  areaM2: z.string().trim().refine((v) => v === '' || (/^\d+([.,]\d{1,2})?$/.test(v) && Number(v.replace(',', '.')) > 0), 'Escribe el área en m², por ejemplo 72.'),
  administrationPesos: z.string().regex(/^\d*$/, 'Solo números.'),
});

export type PropertyFormValues = z.infer<typeof propertyFormSchema>;

export const propertyFormDefaults: PropertyFormValues = {
  name: '',
  propertyType: 'apartment',
  address: '',
  city: '',
  neighborhood: '',
  bedrooms: '',
  bathrooms: '',
  areaM2: '',
  administrationPesos: '',
};
