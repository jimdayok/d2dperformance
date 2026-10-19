-- Additive worker capability handshake. Preserve existing jobs, caps and access.
alter table public.social_video_worker_state
 add column if not exists compositor_version integer not null default 1;
