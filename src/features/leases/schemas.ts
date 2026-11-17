import { z } from 'zod';

import { isValidISODate } from '@/lib/dates';

const isoDate = z.string().refine((v) => isValidISODate(v), 'Escribe una fecha válida (dd/mm/aaaa).');
const pesos = z.string().regex(/^\d*$/, 'Solo números.');

/** Asistente de contrato (flujo 10.4 del plan). */
export const leaseWizardSchema = z
  .object({
    propertyId: z.string().min(1, 'Elige el inmueble.'),
    tenantId: z.string().min(1, 'Elige el inquilino.'),
    leaseUse: z.enum(['residential', 'commercial']),
    rentPesos: pesos.refine((v) => Number(v) > 0, 'Escribe el canon mensual.'),
    administrationMode: z.enum(['separate', 'included', 'none']),
    administrationPesos: pesos,
    paymentDay: z.string().regex(/^\d{1,2}$/, 'Escribe un día entre 1 y 31.').refine((v) => Number(v) >= 1 && Number(v) <= 31, 'Escribe un día entre 1 y 31.'),
    guaranteeType: z.enum(['none', 'co_signer', 'insurance_policy']),
    increaseType: z.enum(['ipc', 'fixed_percentage', 'none']),
    increasePercentage: z.string(),
    startDate: isoDate,
    endDate: isoDate,
    billingStartDate: z.string(),
  })
  .superRefine((v, ctx) => {
    if (v.administrationMode === 'separate' && !(Number(v.administrationPesos) > 0)) {
      ctx.addIssue({ code: 'custom', path: ['administrationPesos'], message: 'Escribe el valor de la administración.' });
    }
    if (v.increaseType === 'fixed_percentage') {
      const n = Number(v.increasePercentage.replace(',', '.'));
      if (!(n > 0 && n <= 100)) ctx.addIssue({ code: 'custom', path: ['increasePercentage'], message: 'Escribe un porcentaje entre 0 y 100.' });
    }
    if (isValidISODate(v.startDate) && isValidISODate(v.endDate) && v.endDate <= v.startDate) {
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'La fecha final debe ser posterior al inicio.' });
    }
    if (v.billingStartDate !== '') {
      if (!isValidISODate(v.billingStartDate)) {
        ctx.addIssue({ code: 'custom', path: ['billingStartDate'], message: 'Escribe una fecha válida (dd/mm/aaaa).' });
      } else if (isValidISODate(v.startDate) && v.billingStartDate < v.startDate) {
        ctx.addIssue({ code: 'custom', path: ['billingStartDate'], message: 'No puede ser anterior al inicio del contrato.' });
      }
    }
  });

export type LeaseWizardValues = z.infer<typeof leaseWizardSchema>;

/** Campos que valida cada paso antes de avanzar. */
export const WIZARD_STEPS = [
  { key: 'property', title: 'Inmueble', fields: ['propertyId'] },
  { key: 'tenant', title: 'Inquilino', fields: ['tenantId'] },
  {
    key: 'terms',
    title: 'Condiciones',
    fields: ['leaseUse', 'rentPesos', 'administrationMode', 'administrationPesos', 'paymentDay', 'guaranteeType', 'increaseType', 'increasePercentage'],
  },
  { key: 'dates', title: 'Fechas', fields: ['startDate', 'endDate', 'billingStartDate'] },
  { key: 'confirm', title: 'Confirmar', fields: [] },
] as const satisfies readonly { key: string; title: string; fields: readonly (keyof LeaseWizardValues)[] }[];
