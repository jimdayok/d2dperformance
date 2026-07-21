import { PortalShell } from "@/components/site-manager/portal-shell";
import { getAccessibleSites, getCurrentUser } from "@/lib/site-manager/access";

export default async function AccountPage() {
  const [user, sites] = await Promise.all([getCurrentUser(), getAccessibleSites()]);
  return <PortalShell definition={null} access={sites[0]?.access ?? null} displayName={user?.user_metadata?.display_name ?? user?.email ?? "Account"} siteCount={sites.length}><div className="max-w-2xl"><h1 className="font-display text-4xl font-semibold">Account</h1><div className="mt-8 rounded-2xl border border-black/10 bg-white p-6"><p className="text-xs uppercase tracking-wider text-black/45">Signed in as</p><p className="mt-2 font-semibold">{user?.email}</p><p className="mt-5 text-sm text-black/55">Password updates are completed through the secure reset link on the sign-in page. Contact D2D Performance if your assigned websites or role are incorrect.</p></div></div></PortalShell>;
}
