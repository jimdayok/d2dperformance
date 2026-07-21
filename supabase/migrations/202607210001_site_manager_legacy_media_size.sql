alter table public.media_assets
  drop constraint if exists media_assets_byte_size_check;

alter table public.media_assets
  add constraint media_assets_byte_size_check
  check (
    byte_size >= 0
    and (
      (source_kind = 'legacy_local' and byte_size <= 52428800)
      or
      (source_kind in ('supabase_draft', 'supabase_public') and byte_size <= 20971520)
    )
  );
