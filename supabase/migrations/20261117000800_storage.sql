-- Domzli · Fase 1 · Storage: buckets privados y políticas por ruta.
-- Ruta: {organization_id}/properties/{property_id}/{archivo}  ·  {organization_id}/leases/{lease_id}/{archivo}

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('property-photos', 'property-photos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('lease-documents', 'lease-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Fotos de inmuebles: el staff administra; el inquilino ve las de su inmueble.
create policy property_photos_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'property-photos'
    and (
      (storage.foldername(name))[1] in (select t.id::text from private.staff_org_ids() as t(id))
      or (storage.foldername(name))[3] in (select t.id::text from private.tenant_property_ids() as t(id))
    )
  );
create policy property_photos_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[2] = 'properties'
    and (storage.foldername(name))[1] in (select t.id::text from private.staff_org_ids() as t(id))
  );
create policy property_photos_objects_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'property-photos'
    and (storage.foldername(name))[1] in (select t.id::text from private.staff_org_ids() as t(id))
  );

-- Documentos de contratos: inmutables una vez cargados (sin UPDATE ni DELETE).
-- El inquilino solo lee los que la tabla documents marca como compartidos.
create policy lease_documents_objects_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'lease-documents'
    and (
      (storage.foldername(name))[1] in (select t.id::text from private.staff_org_ids() as t(id))
      or name in (
        select d.storage_path from public.documents d
        where d.visibility = 'shared'
          and d.archived_at is null
          and d.lease_id in (select private.tenant_lease_ids())
      )
    )
  );
create policy lease_documents_objects_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'lease-documents'
    and (storage.foldername(name))[2] = 'leases'
    and (storage.foldername(name))[1] in (select t.id::text from private.staff_org_ids() as t(id))
  );
