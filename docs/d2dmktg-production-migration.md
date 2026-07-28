# D2D Marketing production migration

Last updated: 2026-07-28

> Architecture correction: the DAY2DAY Marketing proposal site is the primary
> site at `d2dmktg.com`. The Performance application is a subsite at
> `performance.d2dmktg.com`; it is not the apex website.

## Working checklist

### Code changes

- [x] Preserve the existing working tree and create `migration/d2dmktg-production`.
- [x] Move the DAY2DAY Marketing proposal website to the root domain.
- [x] Move the Performance website to `performance.d2dmktg.com`.
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
- [x] Attach `d2dmktg.com` and `www.d2dmktg.com` to the
  `jimdayoks-projects/d2dmktg-proposal` project after cutover approval.
- [x] Attach `performance.d2dmktg.com` to
  `jimdayoks-projects/d2dperformance`.
- [x] Retrieve exact Vercel DNS recommendations through the authenticated domain-config API.
- [x] Keep both `d2dperformance.com` hostnames attached for permanent redirects.

### DNS changes

- [x] Confirm `d2dmktg.com` uses ICDSoft/SureSupport nameservers.
- [x] Confirm current apex and `www` resolve to the ICDSoft web server.
- [x] Capture the authoritative DNS zone before cutover.
- [x] Change only approved apex and `www` website records.
- [x] Validate authoritative DNS propagation and Vercel certificates.

### Redirects

- [x] Implement redirects for both D2D Performance hostnames path-for-path to
  `https://performance.d2dmktg.com`.
- [x] Implement the `www.d2dmktg.com` path-for-path redirect to the apex hostname.
- [x] Map legacy D2D Marketing paths to legitimate current destinations.
- [x] Verify one-hop HTTPS redirects with query-string preservation locally.

### Email-protection checks

- [x] Confirm ICDSoft remains authoritative for D2D Marketing DNS and mail.
- [x] Confirm the public MX target remains `mail.d2dmktg.com`.
- [x] Confirm common mail, webmail, autodiscover, and autoconfig hosts resolve to ICDSoft.
- [x] Capture MX, SPF, DKIM, DMARC, and service records from the authoritative zone.
- [x] Confirm those records are unchanged after cutover.
- [x] Confirm production form delivery into the existing ICDSoft mailbox after cutover.
- [x] Confirm authenticated SMTP and IMAP service endpoints remain on ICDSoft
  with valid TLS.
- [ ] Confirm one new outbound message from an `@d2dmktg.com` mailbox.

### SEO work

- [x] Set `https://d2dmktg.com` as the proposal site's metadata base and
  canonical origin.
- [x] Update sitemap, robots, Open Graph, X/Twitter, and structured-data URLs.
- [x] Preserve the newer site route inventory and map obsolete old-site routes.
- [x] Preserve the existing GTM and Meta Pixel identifiers with environment overrides.
- [x] Preserve the existing Google verification record and add the
  `d2dmktg.com` domain property to the available Search Console account.
- [x] Add the newly approved Search Console TXT record, verify domain
  ownership, and submit the production sitemap successfully.
- [ ] Verify `d2dperformance.com` in the available Search Console account and
  complete Google's Change of Address process.

### Deployment

- [x] Complete local validation.
- [x] Deploy a non-production Vercel preview and validate it.
- [x] Present the exact production cutover and rollback plan for approval.
- [x] Deploy the approved production build.
- [x] Apply only the approved domain and DNS changes.

### Post-deployment verification

- [x] Validate apex, `www`, HTTP-to-HTTPS, old-domain, path, and query redirects.
- [x] Validate primary routes, assets, forms, analytics, sitemap, robots, and metadata.
- [x] Validate desktop and mobile navigation and layout.
- [x] Confirm the ICDSoft website no longer serves on the authoritative apex record.
- [x] Confirm ICDSoft mailbox delivery and mail-service continuity.

### Items requiring owner input or approval

- [x] One approval immediately before the production Vercel/domain/DNS cutover.
- [x] Access to the authoritative ICDSoft DNS editor.
- [x] One clearly labeled production form submission.
- [ ] One new outbound message from an `@d2dmktg.com` mailbox; mailbox
  credentials were not available through the signed-in hosting session.
- [x] Approval to add Search Console's newly issued root TXT verification
  record.
- [ ] Search Console, Bing, Business Profile, analytics, and social-account login where unavailable.

## Current production snapshot

- `d2dmktg.com`: primary production domain for Vercel project
  `d2dmktg-proposal`.
- `www.d2dmktg.com`: one-hop `308` redirect to the apex domain.
- `performance.d2dmktg.com`: production domain for Vercel project
  `d2dperformance`.
- `d2dperformance.com`: one-hop, path-preserving `308` redirect to the
  Performance subsite.
- `www.d2dperformance.com`: one-hop, path-preserving `308` redirect to the
  Performance subsite.
- `d2dmktg.com` nameservers: `ns1.s416.sureserver.com`, `ns2.s416.sureserver.com`.
- `d2dmktg.com` MX: priority `0`, `mail.d2dmktg.com`.
- Proposal production deployment:
  `dpl_3C3zEyGyjjD6SguxU7erqGNhHCZF`.

## Applied DNS plan

The website targets below were returned by Vercel's authenticated domain
configuration API and approved before cutover. Only the apex web record and an
explicit `www` record were changed.

| Type | Host | Current value | Proposed value | Action | Purpose | Email impact |
| --- | --- | --- | --- | --- | --- | --- |
| A | `@` | `192.252.151.38` | `76.76.21.21` | Modified | Serve the apex from Vercel | None; the MX and explicit mail-host A records remain on ICDSoft |
| `www` inherited wildcard | `www` | `192.252.151.38` | — | Superseded with explicit record | Remove the old website endpoint | None |
| CNAME | `www` | — | `cname.vercel-dns.com.` | Added | Route `www` to Vercel for the one-hop apex redirect | None |
| A | `performance` | — | `76.76.21.21` | Added | Route the Performance subsite to Vercel | None |
| MX | `@` | `0 mail.d2dmktg.com.` | Unchanged | Protect | ICDSoft inbound mail | Must remain unchanged |
| A | `mail` | `192.252.151.38` | Unchanged | Protect | ICDSoft mail host | Must remain unchanged |
| A | `mbox` | `192.252.151.38` | Unchanged | Protect | ICDSoft webmail | Unchanged |
| TXT | SPF and verification records | Captured in ICDSoft | Unchanged | Protect | Mail authentication and ownership verification | Unchanged |
| TXT | `@` | — | Google Search Console token | Added after separate approval | Verify `d2dmktg.com` domain-property ownership | None |
| TXT | `dkim._domainkey` | Captured in ICDSoft | Unchanged | Protect | DKIM signing | Unchanged |
| TXT | `_dmarc` | No record existed | Unchanged | Protect | DMARC policy | Unchanged |
| NS | `@` | `ns1.s416.sureserver.com`, `ns2.s416.sureserver.com` | Unchanged | Protect | Authoritative DNS remains at ICDSoft | Must remain unchanged |

## Verified proposal deployment

- Preview:
  `https://d2dmktg-proposal-awuoj778d-jimdayoks-projects.vercel.app`
- Vercel production deployment: `dpl_3C3zEyGyjjD6SguxU7erqGNhHCZF`
- Local lint, TypeScript, 22 automated tests, production build, and static
  export passed.
- All proposal routes plus sitemap and robots returned `200` from the Vercel
  preview and production deployment.
- Desktop and mobile browser checks found no overflow, broken images,
  navigation failure, hydration failure, or unexpected console errors.

## Production verification

- Proposal production deployment `dpl_3C3zEyGyjjD6SguxU7erqGNhHCZF` is
  `READY`.
- The apex serves the DAY2DAY Marketing proposal site. Representative proposal
  routes, legal pages, sitemap, and robots return `200`.
- `performance.d2dmktg.com` serves the Performance application.
- Every tested page has one canonical URL on `https://d2dmktg.com`, correct
  D2D Marketing titles, and no former company-name reference.
- Sitemap, robots, manifest, Open Graph, JSON-LD, analytics tags, and social
  images are reachable and use the canonical origin.
- `www.d2dmktg.com` redirects to the proposal apex in one `308` hop.
- Both legacy Performance hostnames redirect to
  `performance.d2dmktg.com` in one `308` hop while preserving the path and
  query string.
- A single clearly labeled contact-form test returned `200`; ICDSoft's
  post-cutover mail-delivery log records successful local delivery to the
  established mailbox.
- ICDSoft SMTP on port `465` and IMAP on port `993` both complete TLS 1.3
  handshakes with valid certificates. A new authenticated outbound mailbox
  message still requires mailbox access.
- The `d2dmktg.com` Search Console domain property is verified through its
  separately approved root TXT record. Google accepted
  `https://d2dmktg.com/sitemap.xml` with a successful submission status on
  2026-07-28.
- The available Search Console account does not currently contain a
  `d2dperformance.com` property, so Google's Change of Address process remains
  pending legacy-domain verification.
- Vercel reports both new domains valid with SSL. Its newer anycast DNS targets
  are optional recommendations; the approved `76.76.21.21` and
  `cname.vercel-dns.com.` targets remain valid and are serving production.
- The workstation's local router may retain the former apex A record until its
  prior TTL expires. Authoritative DNS and public DNS-over-HTTPS resolvers
  already return the new Vercel record.

## Rollback principle

Until post-launch verification is complete, keep the ICDSoft website files and
all email services intact. A website-only rollback consists of reattaching the
apex and `www` domains to the prior Vercel project, or restoring the prior apex
and `www` DNS records to `192.252.151.38`. The Performance subsite can be rolled
back by removing only its explicit `performance` web record. No MX, TXT, mail,
webmail, autodiscover, autoconfig, nameserver, registrar, mailbox, or calendar
record is part of the migration.
