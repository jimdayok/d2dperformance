# D2D Marketing production migration

Last updated: 2026-07-27

## Working checklist

### Code changes

- [x] Preserve the existing working tree and create `migration/d2dmktg-production`.
- [x] Make the newer consulting website the root website.
- [x] Remove route-group conflicts without discarding unrelated work.
- [x] Add explicit legacy-path redirects and redirect tests.
- [x] Add privacy, terms, and not-found coverage where missing.

### Brand and content

- [x] Replace public company-name references with D2D Marketing or DAY2DAY Marketing.
- [x] Replace old-domain links and accessible labels.
- [x] Update contact, form, portal, and email-template branding.
- [x] Retain legitimate uses of “performance” that describe business outcomes.
- [x] Retain the strongest compatible DAY2DAY logo and icon assets.

### Vercel configuration

- [x] Confirm linked project `jimdayoks-projects/d2dperformance`.
- [x] Confirm Vercel authentication and current production deployment.
- [x] Inventory environment-variable names without reading values.
- [ ] Add `d2dmktg.com` and `www.d2dmktg.com` only after cutover approval.
- [x] Retrieve exact Vercel DNS recommendations through the authenticated domain-config API.
- [ ] Keep both `d2dperformance.com` hostnames attached for permanent redirects.

### DNS changes

- [x] Confirm `d2dmktg.com` uses ICDSoft/SureSupport nameservers.
- [x] Confirm current apex and `www` resolve to the ICDSoft web server.
- [ ] Capture the authoritative DNS zone before cutover.
- [ ] Change only approved apex and `www` website records.
- [ ] Validate DNS propagation and Vercel certificates.

### Redirects

- [x] Implement redirects for both D2D Performance hostnames path-for-path to `https://d2dmktg.com`.
- [x] Implement the `www.d2dmktg.com` path-for-path redirect to the apex hostname.
- [x] Map legacy D2D Marketing paths to legitimate current destinations.
- [x] Verify one-hop HTTPS redirects with query-string preservation locally.

### Email-protection checks

- [x] Confirm ICDSoft remains authoritative for D2D Marketing DNS and mail.
- [x] Confirm the public MX target remains `mail.d2dmktg.com`.
- [x] Confirm common mail, webmail, autodiscover, and autoconfig hosts resolve to ICDSoft.
- [ ] Capture MX, SPF, DKIM, DMARC, and service records from the authoritative zone.
- [ ] Confirm those records are byte-for-byte unchanged after cutover.
- [ ] Confirm real send and receive operation with the account owner after cutover.

### SEO work

- [x] Set `https://d2dmktg.com` as the metadata base and canonical origin.
- [x] Update sitemap, robots, Open Graph, X/Twitter, and structured-data URLs.
- [x] Preserve the newer site route inventory and map obsolete old-site routes.
- [x] Preserve the existing GTM and Meta Pixel identifiers with environment overrides.
- [ ] Prepare Search Console, Bing, Business Profile, analytics, and directory actions.

### Deployment

- [x] Complete local validation.
- [x] Deploy a non-production Vercel preview and validate it.
- [ ] Present the exact production cutover and rollback plan for approval.
- [ ] Deploy the approved production build.
- [ ] Apply only the approved domain and DNS changes.

### Post-deployment verification

- [ ] Validate apex, `www`, HTTP-to-HTTPS, old-domain, path, and query redirects.
- [ ] Validate primary routes, assets, forms, analytics, sitemap, robots, and metadata.
- [ ] Validate desktop and mobile navigation and layout.
- [ ] Confirm the ICDSoft website no longer serves on the apex domain.
- [ ] Confirm ICDSoft email still sends and receives.

### Items requiring owner input or approval

- [ ] One approval immediately before the production Vercel/domain/DNS cutover.
- [ ] Access to the authoritative ICDSoft DNS editor if no authenticated integration is available.
- [ ] One clearly labeled form submission destination if delivery cannot be verified safely.
- [ ] One post-cutover send/receive confirmation from an `@d2dmktg.com` mailbox.
- [ ] Search Console, Bing, Business Profile, analytics, and social-account login where unavailable.

## Current production snapshot

- `www.d2dperformance.com`: Vercel project `d2dperformance`, proxied by Cloudflare.
- `d2dperformance.com`: redirects to `https://www.d2dperformance.com`.
- `d2dmktg.com`: ICDSoft/Apache website at `192.252.151.38`.
- `www.d2dmktg.com`: redirects to the apex on ICDSoft/Apache.
- `d2dmktg.com` nameservers: `ns1.s416.sureserver.com`, `ns2.s416.sureserver.com`.
- `d2dmktg.com` MX: priority `0`, `mail.d2dmktg.com`.

## Approved-record candidate

The exact website targets below were returned by Vercel's authenticated domain
configuration API on 2026-07-27. Domain attachment and DNS mutation have not yet
occurred.

| Type | Host | Current value | Proposed value | Action | Purpose | Email impact |
| --- | --- | --- | --- | --- | --- | --- |
| A | `@` | `192.252.151.38` | `76.76.21.21` | Modify after approval | Serve the apex from Vercel | None; the MX and explicit mail-host A records remain on ICDSoft |
| A | `www` | `192.252.151.38` | — | Replace after approval | Remove the old website endpoint | None |
| CNAME | `www` | — | `cname.vercel-dns.com.` | Add after approval | Route `www` to Vercel for the one-hop apex redirect | None |
| MX | `@` | `0 mail.d2dmktg.com.` | Unchanged | Protect | ICDSoft inbound mail | Must remain unchanged |
| A | `mail` | `192.252.151.38` | Unchanged | Protect | ICDSoft mail host | Must remain unchanged |
| A | `webmail` | `192.252.151.38` | Unchanged | Protect | ICDSoft webmail | Must remain unchanged |
| A | `autodiscover` | `192.252.151.38` | Unchanged | Protect | Mail client configuration | Must remain unchanged |
| A | `autoconfig` | `192.252.151.38` | Unchanged | Protect | Mail client configuration | Must remain unchanged |
| TXT/CNAME | SPF, DKIM, DMARC, verification records | Capture in ICDSoft before mutation | Unchanged | Protect | Mail authentication and ownership verification | Must remain byte-for-byte unchanged |
| NS | `@` | `ns1.s416.sureserver.com`, `ns2.s416.sureserver.com` | Unchanged | Protect | Authoritative DNS remains at ICDSoft | Must remain unchanged |

## Verified candidate deployment

- Preview: `https://d2dperformance-2rbtuu8hv-jimdayoks-projects.vercel.app`
- Vercel deployment: `dpl_34bQnoocqsnhT1oYhpVMsugoGPgZ`
- Local lint, TypeScript, 31 automated tests, and production build passed.
- All 13 public content routes plus sitemap, robots, and manifest returned `200`
  from the protected Vercel preview.
- Desktop and mobile browser checks found no overflow, broken images,
  navigation failure, hydration failure, or unexpected console errors.

## Rollback principle

Until post-launch verification is complete, keep the ICDSoft website files and all email services intact. A website-only rollback consists of restoring the prior apex and `www` DNS records to `192.252.151.38`; no MX, TXT, mail, webmail, autodiscover, autoconfig, nameserver, registrar, mailbox, or calendar record is part of the migration.
