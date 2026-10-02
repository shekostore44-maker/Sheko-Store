-- =============================================================
-- Storage: one public "media" bucket for product, category and
-- banner images. Anyone can view; only admins upload or delete.
-- =============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

create policy "media: admin upload"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin update"
  on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()))
  with check (bucket_id = 'media' and (select public.is_admin()));

create policy "media: admin delete"
  on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
