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
