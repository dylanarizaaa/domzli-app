import { supabase } from '@/lib/supabase';
import type { PropertyRow } from '@/types/database';

import { toPropertySummary, type PropertySummary } from './domain';
import type { PropertyFormValues } from './schemas';

export async function fetchProperties(organizationId: string): Promise<PropertySummary[]> {
  const { data, error } = await supabase
    .from('v_property_overview')
    .select('*')
    .eq('organization_id', organizationId)
    .is('archived_at', null)
    .order('name');
  if (error) throw error;
  return (data ?? []).map(toPropertySummary);
}

export async function createProperty(organizationId: string, values: PropertyFormValues): Promise<PropertyRow> {
  const { data, error } = await supabase
    .from('properties')
    .insert({
      organization_id: organizationId,
      name: values.name,
      property_type: values.propertyType,
      address: values.address,
      city: values.city,
      neighborhood: values.neighborhood || null,
      bedrooms: values.bedrooms === '' ? null : Number(values.bedrooms),
      bathrooms: values.bathrooms === '' ? null : Number(values.bathrooms),
      area_m2: values.areaM2 === '' ? null : Number(values.areaM2.replace(',', '.')),
      administration_value: values.administrationPesos === '' ? 0 : Number(values.administrationPesos),
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function fetchProperty(propertyId: string): Promise<PropertyRow> {
  const { data, error } = await supabase.from('properties').select('*').eq('id', propertyId).single();
  if (error) throw error;
  return data;
}

export async function updateProperty(propertyId: string, values: PropertyFormValues): Promise<void> {
  const { error } = await supabase
    .from('properties')
    .update({
      name: values.name,
      property_type: values.propertyType,
      address: values.address,
      city: values.city,
      neighborhood: values.neighborhood || null,
      bedrooms: values.bedrooms === '' ? null : Number(values.bedrooms),
      bathrooms: values.bathrooms === '' ? null : Number(values.bathrooms),
      area_m2: values.areaM2 === '' ? null : Number(values.areaM2.replace(',', '.')),
      administration_value: values.administrationPesos === '' ? 0 : Number(values.administrationPesos),
    })
    .eq('id', propertyId);
  if (error) throw error;
}

/** Fila → valores del formulario (para editar). */
export function toPropertyFormValues(row: PropertyRow): PropertyFormValues {
  return {
    name: row.name,
    propertyType: row.property_type,
    address: row.address,
    city: row.city,
    neighborhood: row.neighborhood ?? '',
    bedrooms: row.bedrooms === null ? '' : String(row.bedrooms),
    bathrooms: row.bathrooms === null ? '' : String(row.bathrooms),
    areaM2: row.area_m2 === null ? '' : String(row.area_m2).replace('.', ','),
    administrationPesos: row.administration_value ? String(Math.round(Number(row.administration_value))) : '',
  };
}
