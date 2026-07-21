update public.organizations
set
  name = 'Alford Custom Builders',
  updated_at = now()
where slug = 'alford-custom-homes';

update public.sites
set
  name = 'Alford Custom Builders',
  production_url = 'https://alfordcustombuilders.com',
  preview_url = 'https://alfordcustombuilders.com',
  updated_at = now()
where slug = 'alford-custom-homes';
