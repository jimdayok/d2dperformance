begin;

insert into public.organizations (name, slug, status)
values
  ('Acadia Eye Center', 'acadia-eye', 'active'),
  ('Phoenix Builds', 'phoenix-builds', 'active')
on conflict (slug) do update set name = excluded.name, status = excluded.status, updated_at = now();

insert into public.sites (organization_id, name, slug, production_url, preview_url, status, publishing_mode, config)
select id, 'Acadia Eye Center', 'acadia-eye', 'https://www.acadiaeye.com', 'https://www.acadiaeye.com', 'active', 'approval_required', '{"integration":"nextjs-cms-v1"}'::jsonb
from public.organizations where slug = 'acadia-eye'
on conflict (slug) do update set name = excluded.name, production_url = excluded.production_url, preview_url = excluded.preview_url, status = excluded.status, publishing_mode = excluded.publishing_mode, config = excluded.config, updated_at = now();

insert into public.sites (organization_id, name, slug, production_url, preview_url, status, publishing_mode, config)
select id, 'Phoenix Builds', 'phoenix-builds', 'https://phoenix-builds.com', 'https://phoenix-builds-website.vercel.app', 'active', 'approval_required', '{"integration":"nextjs-cms-v1","productionCutover":"pending"}'::jsonb
from public.organizations where slug = 'phoenix-builds'
on conflict (slug) do update set name = excluded.name, production_url = excluded.production_url, preview_url = excluded.preview_url, status = excluded.status, publishing_mode = excluded.publishing_mode, config = excluded.config, updated_at = now();

with seed(site_slug, content_type, content_key, title, payload) as (
  values
    ('acadia-eye', 'page_section', 'homepage-hero', 'Homepage hero', '{
      "eyebrow":"Boutique Eye Care in Bangor, Maine",
      "heading":"Thoughtful eye care,",
      "emphasis":"designed around you.",
      "summary":"Acadia Eye Center brings together comprehensive optometric and medical eye care, attentive service, and a carefully curated optical experience.",
      "primaryCtaLabel":"Request an Appointment",
      "secondaryCtaLabel":"Meet Our Doctors",
      "detailItems":["Comprehensive Care","Medical Eye Care","Optical Boutique"],
      "seo":{"title":"Acadia Eye Center | Eye Care in Bangor, Maine","description":"Boutique optometric and medical eye care in Bangor, Maine, with comprehensive eye exams, specialty services, contact lenses, and curated eyewear."}
    }'::jsonb),
    ('acadia-eye', 'page', 'services', 'Services page introduction', '{
      "eyebrow":"Care at Acadia","title":"A wider view of your eye health.","description":"Explore comprehensive vision services and advanced care pathways, each approached with clarity and individual attention.",
      "seo":{"title":"Vision Services | Acadia Eye Center","description":"Explore comprehensive eye care, medical eye care, specialty contact lenses, and advanced care at Acadia Eye Center in Bangor, Maine."}
    }'::jsonb),
    ('phoenix-builds', 'page_section', 'gateway', 'Website gateway', '{
      "commercialHeading":"Commercial Construction","commercialSummary":"Purpose-built delivery for schools, civic owners, campuses, and growing organizations.","commercialCtaLabel":"Enter commercial",
      "residentialHeading":"Residential Construction","residentialSummary":"Custom homes shaped around your land, your routines, and the way you want to live.","residentialCtaLabel":"Enter residential",
      "seo":{"title":"Phoenix Builds | Construction Rising","description":"Phoenix Builds provides owner-led commercial construction and custom-home building in Kalamazoo and across West Michigan."}
    }'::jsonb),
    ('phoenix-builds', 'page_section', 'commercial-hero', 'Commercial homepage hero', '{
      "eyebrow":"Commercial construction / West Michigan","heading":"Build certainty into what comes next.","summary":"Owner-led construction for complex public, institutional, and commercial work—from early feasibility through an accountable closeout.","primaryCtaLabel":"Discuss a Project","secondaryCtaLabel":"Explore Our Work",
      "seo":{"title":"Commercial Construction | Phoenix Builds","description":"Owner-led commercial construction planning and delivery for organizations across West Michigan."}
    }'::jsonb),
    ('phoenix-builds', 'page_section', 'residential-hero', 'Residential homepage hero', '{
      "eyebrow":"Custom homes / West Michigan","heading":"Your new beginning, built around you.","summary":"Thoughtful custom homes shaped around the land, the light, and the life you plan to live there.","primaryCtaLabel":"Start a Conversation","secondaryCtaLabel":"See Available Homes",
      "seo":{"title":"Custom Homes | Phoenix Builds","description":"Phoenix Builds creates custom homes and move-in-ready residences in Kalamazoo and across West Michigan."}
    }'::jsonb)
)
insert into public.content_entries (site_id, content_type, content_key, title, workflow_status, draft_data, published_data, draft_revision, published_revision, published_at)
select sites.id, seed.content_type, seed.content_key, seed.title, 'published', seed.payload, seed.payload, 1, 1, now()
from seed join public.sites on sites.slug = seed.site_slug
on conflict (site_id, content_type, content_key) do nothing;

insert into public.content_versions (content_entry_id, revision, data, action)
select entries.id, 1, entries.draft_data, 'created'
from public.content_entries entries
join public.sites sites on sites.id = entries.site_id
where sites.slug in ('acadia-eye', 'phoenix-builds')
on conflict (content_entry_id, revision, action) do nothing;

commit;
