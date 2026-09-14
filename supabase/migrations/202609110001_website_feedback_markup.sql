alter table public.website_feedback_pages
  add column if not exists ratings jsonb not null default '{}'::jsonb,
  add column if not exists annotations jsonb not null default '[]'::jsonb;

alter table public.website_feedback_pages
  drop constraint if exists website_feedback_pages_ratings_object,
  add constraint website_feedback_pages_ratings_object
    check (jsonb_typeof(ratings) = 'object'),
  drop constraint if exists website_feedback_pages_annotations_array,
  add constraint website_feedback_pages_annotations_array
    check (jsonb_typeof(annotations) = 'array' and jsonb_array_length(annotations) <= 100);
