# Alford vertical-slice verification

Prerequisites: local Supabase with migrations applied; Alford seed completed; two test users (Alford editor and D2D publisher); both apps running with matching development signing keys; browser permits local Draft Mode cookies.

1. Open `http://portal.localhost:3000/login`, sign in as the Alford editor, and confirm only Alford is listed.
2. Open Homepage, change the hero heading, and choose **Save Draft**. Confirm a new draft revision/version exists and `get_published_content` still returns the previous heading.
3. Choose **Open Preview in New Tab**. Confirm the real Alford homepage DOM, styling, data attributes, and animation remain intact while the draft heading is visible and the Draft Preview badge appears.
4. Exit preview and confirm the ordinary Alford page still shows the published heading.
5. Submit for review. Confirm workflow `in_review` and that the editor has no Publish action.
6. Sign in as the D2D publisher, open Review Queue, publish the entry, and confirm the publish event reports successful targeted revalidation.
7. Reload the ordinary Alford page and confirm the new heading. Confirm one immutable `published` version and publisher/timestamp fields.
8. From Version History, restore the prior snapshot. Confirm it creates a new draft and does not change the live heading. Preview and publish through the normal workflow if rollback is desired.
9. Using a second tenant test user, attempt direct reads and draft RPC calls against Alford IDs. Run `supabase/tests/site_manager_rls.sql`; all cross-tenant reads/writes must be denied.
10. Set `CMS_ENABLED=false`, restart Alford, and confirm the original static hero and every existing public URL still work.
