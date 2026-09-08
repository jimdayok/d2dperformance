"use client";

import { useActionState } from "react";
import {
  setEntitlementAction,
  setProductMemberAction,
  type ProductAdminState,
} from "@/app/(portal)/portal/(authenticated)/admin/products/actions";

type Organization = { id: string; name: string };
type Profile = { id: string; display_name: string; email: string };
type Entitlement = { id: string; organization_id: string; product: string; status: string; launch_url: string };
type Membership = { id: string; organization_id: string; user_id: string; product: string; role: string };

const initialState: ProductAdminState = {};
const products = [
  { value: "social", label: "D2D Social" },
  { value: "brand_vault", label: "Brand Vault" },
  { value: "web_management", label: "Web Management" },
];

function Feedback({ state }: { state: ProductAdminState }) {
  if (!state.error && !state.message) return null;
  return <p role={state.error ? "alert" : "status"} className={`mt-3 text-sm ${state.error ? "text-red-700" : "text-emerald-700"}`}>{state.error ?? state.message}</p>;
}

export function ProductAccessAdmin({ organizations, profiles, entitlements, memberships }: { organizations: Organization[]; profiles: Profile[]; entitlements: Entitlement[]; memberships: Membership[] }) {
  const [entitlementState, entitlementAction, entitlementPending] = useActionState(setEntitlementAction, initialState);
  const [memberState, memberAction, memberPending] = useActionState(setProductMemberAction, initialState);
  const organizationNames = new Map(organizations.map((organization) => [organization.id, organization.name]));
  const profileNames = new Map(profiles.map((profile) => [profile.id, profile.display_name || profile.email]));

  return <div className="space-y-10">
    <header className="border-b border-[#241c17]/12 pb-7"><p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">Platform administration</p><h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Customer access</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d6258]">Turn products on for an organization, then assign each person only the role they need.</p></header>

    <section className="grid gap-6 xl:grid-cols-2">
      <form action={entitlementAction} className="portal-panel grid gap-4 p-5"><h2 className="font-display text-2xl font-semibold">Product entitlement</h2><label className="text-xs font-semibold">Organization<select name="organizationId" required className="portal-field mt-2 w-full px-3 py-2.5 text-sm">{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label><label className="text-xs font-semibold">Product<select name="product" required className="portal-field mt-2 w-full px-3 py-2.5 text-sm">{products.map((product) => <option key={product.value} value={product.value}>{product.label}</option>)}</select></label><label className="text-xs font-semibold">Status<select name="status" defaultValue="active" className="portal-field mt-2 w-full px-3 py-2.5 text-sm"><option value="active">Active</option><option value="suspended">Suspended</option><option value="archived">Archived</option></select></label><label className="text-xs font-semibold">Launch URL<input name="launchUrl" type="url" required defaultValue="https://webadmin.d2dmktg.com/portal/marketing" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label><label className="text-xs font-semibold">External workspace ID <span className="font-normal text-[#877b70]">(optional)</span><input name="externalWorkspaceId" className="portal-field mt-2 w-full px-3 py-2.5 text-sm" /></label><div><button disabled={entitlementPending} className="portal-primary-button px-4 py-2.5 text-sm font-semibold">{entitlementPending ? "Saving…" : "Save product access"}</button><Feedback state={entitlementState} /></div></form>

      <form action={memberAction} className="portal-panel grid gap-4 p-5"><h2 className="font-display text-2xl font-semibold">Customer role</h2><label className="text-xs font-semibold">Organization<select name="organizationId" required className="portal-field mt-2 w-full px-3 py-2.5 text-sm">{organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}</select></label><label className="text-xs font-semibold">Person<select name="userId" required className="portal-field mt-2 w-full px-3 py-2.5 text-sm">{profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.display_name || profile.email} — {profile.email}</option>)}</select></label><label className="text-xs font-semibold">Product<select name="product" required className="portal-field mt-2 w-full px-3 py-2.5 text-sm">{products.map((product) => <option key={product.value} value={product.value}>{product.label}</option>)}</select></label><label className="text-xs font-semibold">Role<select name="role" defaultValue="reviewer" className="portal-field mt-2 w-full px-3 py-2.5 text-sm"><option value="manager">Manager</option><option value="creator">Creator</option><option value="reviewer">Reviewer</option><option value="viewer">Viewer</option></select></label><div><button disabled={memberPending} className="portal-primary-button px-4 py-2.5 text-sm font-semibold">{memberPending ? "Saving…" : "Save customer role"}</button><Feedback state={memberState} /></div></form>
    </section>

    <section><h2 className="font-display text-3xl font-semibold">Current product access</h2><div className="mt-5 grid gap-3">{entitlements.map((entitlement) => <article key={entitlement.id} className="portal-panel flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-semibold">{organizationNames.get(entitlement.organization_id) ?? "Unknown organization"}</p><p className="mt-1 text-xs capitalize text-[#6d6258]">{entitlement.product.replaceAll("_", " ")} · {entitlement.status}</p></div><a href={entitlement.launch_url} className="text-xs font-semibold text-[#7b4725] underline">{entitlement.launch_url}</a></article>)}</div></section>

    <section><h2 className="font-display text-3xl font-semibold">Assigned people</h2><div className="mt-5 grid gap-3">{memberships.map((membership) => <article key={membership.id} className="portal-panel p-4"><p className="font-semibold">{profileNames.get(membership.user_id) ?? "Unknown user"}</p><p className="mt-1 text-xs capitalize text-[#6d6258]">{organizationNames.get(membership.organization_id)} · {membership.product.replaceAll("_", " ")} · {membership.role}</p></article>)}</div></section>
  </div>;
}
