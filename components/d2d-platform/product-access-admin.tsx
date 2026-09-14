"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Activity, Building2, Check, FileStack, HardDrive, KeyRound, LockKeyhole, Mail, Plus, Power, UserPlus, UserRoundCheck, UsersRound } from "lucide-react";
import {
  addCustomerUserAction,
  createCustomerOrganizationAction,
  removeProductMemberAction,
  sendClientInstructionsAction,
  setEntitlementAction,
  setOrganizationMemberRoleAction,
  setProductMemberAction,
  type ProductAdminState,
} from "@/app/(portal)/portal/(authenticated)/admin/products/actions";
import { customerSlugFromName } from "@/lib/d2d-platform/organizations";
import { d2dProducts, type D2DProductDefinition } from "@/lib/d2d-platform/products";
import type { ProductRole } from "@/lib/d2d-platform/types";
import type { AdminDashboardData } from "@/lib/d2d-platform/admin-reporting";

type Organization = { id: string; name: string };
type Profile = { id: string; display_name: string; email: string };
type OrganizationMember = { organization_id: string; user_id: string; role: string };
type Entitlement = { id: string; organization_id: string; product: string; status: string };
type Membership = { id: string; organization_id: string; user_id: string; product: string; role: string };

const initialState: ProductAdminState = {};
const roleLabels: Record<ProductRole, string> = {
  manager: "Manager",
  creator: "Creator",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

const organizationRoleLabels = {
  site_admin: "Customer administrator",
  publisher: "Publisher",
  editor: "Editor",
  viewer: "Viewer",
} as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

function formatDate(value: string | null) {
  if (!value) return "Has not signed in";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(new Date(value));
}

function activityLabel(action: string) {
  const labels: Record<string, string> = {
    "organization.created": "Customer added",
    "organization_member.assigned": "Person assigned",
    "product_entitlement.set": "Customer service changed",
    "product_member.set": "Person access changed",
    "product_member.removed": "Person access removed",
    "client.instructions_email_sent": "Login instructions emailed",
  };
  return labels[action] ?? action.replaceAll("_", " ").replaceAll(".", " · ");
}

function Feedback({ state }: { state: ProductAdminState }) {
  if (!state.error && !state.message) return null;
  return (
    <p
      role={state.error ? "alert" : "status"}
      className={`mt-3 text-xs leading-5 ${state.error ? "text-red-700" : "text-emerald-700"}`}
    >
      {state.error ?? state.message}
    </p>
  );
}

function SubmitButton({ active, activeLabel, inactiveLabel, disabled = false, toggle = false }: { active: boolean; activeLabel: string; inactiveLabel: string; disabled?: boolean; toggle?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      aria-pressed={toggle ? active : undefined}
      className={`inline-flex min-w-28 items-center justify-center gap-2 rounded-md border px-4 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${active ? "border-[#315d4b] bg-[#315d4b] text-white hover:bg-[#284d3e]" : "border-[#2b211b]/18 bg-white/70 text-[#3a3029] hover:border-[#9a5f34]/55 hover:text-[#7b4725]"}`}
    >
      {pending ? "Saving…" : active ? activeLabel : inactiveLabel}
    </button>
  );
}

function CreateCustomerButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="inline-flex min-w-36 items-center justify-center gap-2 rounded-md border border-[#315d4b] bg-[#315d4b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#284d3e] disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Plus size={16} />
      {pending ? "Adding…" : "Add customer"}
    </button>
  );
}

function CreateCustomerForm({ onCreated }: { onCreated: (organizationId: string) => void }) {
  const [name, setName] = useState("");
  const [state, action] = useActionState(async (previousState: ProductAdminState, formData: FormData) => {
    const result = await createCustomerOrganizationAction(previousState, formData);
    if (result.organizationId) {
      onCreated(result.organizationId);
      setName("");
    }
    return result;
  }, initialState);
  const slug = customerSlugFromName(name);

  return (
    <section className="portal-panel border p-5 sm:p-6" aria-labelledby="add-customer-heading">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,34rem)] lg:items-end">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">Customer setup</p>
          <h2 id="add-customer-heading" className="mt-2 font-display text-3xl font-semibold">Add a customer</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d6258]">
            Enter the business name. The customer starts with every service off, so nothing is shared until you choose what to turn on.
          </p>
        </div>
        <form action={action} className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">
            Customer name
            <input
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              maxLength={160}
              autoComplete="organization"
              placeholder="Mike’s Off the Square"
              className="portal-field mt-2 w-full px-3 py-3 text-sm normal-case tracking-normal"
            />
          </label>
          <div className="self-end"><CreateCustomerButton disabled={!name.trim() || !slug} /></div>
          <p className="text-xs leading-5 text-[#74685e] sm:col-span-2">
            {slug ? `Account name: ${slug}` : "The account name will be created automatically."}
          </p>
          <div className="sm:col-span-2"><Feedback state={state} /></div>
        </form>
      </div>
    </section>
  );
}

function DashboardOverview({ dashboard }: { dashboard: AdminDashboardData }) {
  const cards = [
    { label: "Active customers", value: dashboard.customers, detail: `${dashboard.enabledServices} services turned on`, icon: Building2 },
    { label: "People with access", value: dashboard.users, detail: `${dashboard.pendingActivation} awaiting first sign-in`, icon: UsersRound },
    { label: "Signed in · 30 days", value: dashboard.signedInLast30Days, detail: "Verified account sign-ins", icon: KeyRound },
    { label: "Files managed", value: dashboard.totalFiles, detail: formatBytes(dashboard.totalBytes), icon: FileStack },
  ];

  return (
    <section aria-labelledby="headquarters-overview-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">Live overview</p>
          <h2 id="headquarters-overview-heading" className="mt-2 font-display text-3xl font-semibold">What needs attention</h2>
        </div>
        <p className="text-xs text-[#74685e]">Counts refresh whenever this page opens.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, detail, icon: Icon }) => (
          <article key={label} className="portal-panel border p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d6258]">{label}</p>
                <p className="mt-3 font-display text-4xl font-semibold">{value.toLocaleString()}</p>
              </div>
              <span className="grid size-9 place-items-center rounded-full bg-[#315d4b]/10 text-[#315d4b]"><Icon size={17} /></span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[#74685e]">{detail}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="portal-panel overflow-hidden border">
          <div className="flex items-center justify-between gap-3 border-b border-[#241c17]/10 px-5 py-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d6258]">Account activity</p><h3 className="mt-1 font-display text-2xl font-semibold">Recent sign-ins</h3></div>
            <UsersRound size={18} className="text-[#315d4b]" />
          </div>
          <div className="divide-y divide-[#241c17]/8">
            {dashboard.usersActivity.slice(0, 6).map((person) => (
              <div key={person.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{person.displayName || person.email}</p><p className="truncate text-xs text-[#74685e]">{person.email}</p></div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${person.lastSignInAt ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>{formatDate(person.lastSignInAt)}</span>
              </div>
            ))}
            {dashboard.usersActivity.length === 0 ? <p className="px-5 py-6 text-sm text-[#74685e]">No customer sign-in records yet.</p> : null}
          </div>
        </article>

        <article className="portal-panel overflow-hidden border">
          <div className="flex items-center justify-between gap-3 border-b border-[#241c17]/10 px-5 py-4">
            <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d6258]">Administration log</p><h3 className="mt-1 font-display text-2xl font-semibold">Recent changes</h3></div>
            <Activity size={18} className="text-[#9a5f34]" />
          </div>
          <div className="divide-y divide-[#241c17]/8">
            {dashboard.recentActivity.slice(0, 6).map((event) => (
              <div key={event.id} className="px-5 py-3.5">
                <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{activityLabel(event.action)}</p><span className="shrink-0 text-[11px] text-[#877b70]">{formatDate(event.createdAt)}</span></div>
                <p className="mt-1 text-xs text-[#74685e]">{event.organizationName} · {event.actorName}</p>
              </div>
            ))}
            {dashboard.recentActivity.length === 0 ? <p className="px-5 py-6 text-sm text-[#74685e]">No administration changes yet.</p> : null}
          </div>
        </article>
      </div>

      <article className="portal-panel overflow-hidden border">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#241c17]/10 px-5 py-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#6d6258]">File volume</p><h3 className="mt-1 font-display text-2xl font-semibold">Storage by customer</h3></div>
          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${dashboard.vaultConnected ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}><HardDrive size={13} />{dashboard.vaultConnected ? "Website + Brand Vault live" : "Website files live · Brand Vault connection pending"}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[42rem] text-left text-sm">
            <thead className="bg-[#241c17]/[0.025] text-[10px] uppercase tracking-[0.13em] text-[#74685e]"><tr><th className="px-5 py-3 font-semibold">Customer</th><th className="px-5 py-3 font-semibold">Website files</th><th className="px-5 py-3 font-semibold">Brand Vault files</th><th className="px-5 py-3 font-semibold">Total storage</th></tr></thead>
            <tbody className="divide-y divide-[#241c17]/8">
              {dashboard.fileUsage.map((row) => <tr key={row.organizationId}><td className="px-5 py-3.5 font-semibold">{row.organizationName}</td><td className="px-5 py-3.5 text-[#6d6258]">{row.webFiles.toLocaleString()}</td><td className="px-5 py-3.5 text-[#6d6258]">{dashboard.vaultConnected ? row.vaultFiles.toLocaleString() : "Pending connection"}</td><td className="px-5 py-3.5 text-[#6d6258]">{formatBytes(row.webBytes + row.vaultBytes)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </article>
    </section>
  );
}

function AddPersonButton() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="portal-primary-button inline-flex items-center justify-center gap-2 px-5 py-3 text-sm font-semibold disabled:opacity-50">
      <UserPlus size={16} /> {pending ? "Creating access…" : "Add person & assign access"}
    </button>
  );
}

function AddPersonForm({
  organization,
  entitlements,
  identityProvisioningReady,
  onAdded,
}: {
  organization: Organization;
  entitlements: Entitlement[];
  identityProvisioningReady: boolean;
  onAdded: (userId: string) => void;
}) {
  const [selectedProducts, setSelectedProducts] = useState<Record<string, boolean>>({});
  const [state, action] = useActionState(async (previousState: ProductAdminState, formData: FormData) => {
    const result = await addCustomerUserAction(previousState, formData);
    if (result.userId) onAdded(result.userId);
    return result;
  }, initialState);

  return (
    <section className="portal-panel mt-5 border p-5 sm:p-6" aria-labelledby="add-person-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9a5f34]">Customer user setup</p>
          <h3 id="add-person-heading" className="mt-2 font-display text-2xl font-semibold">Add a person to {organization.name}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d6258]">Enter the person once, choose their overall customer role, and select every D2D service they should be able to open.</p>
        </div>
        <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${identityProvisioningReady ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"}`}>
          <span className={`size-1.5 rounded-full ${identityProvisioningReady ? "bg-emerald-600" : "bg-amber-600"}`} />
          {identityProvisioningReady ? "New-user invitations ready" : "Existing accounts can be assigned"}
        </span>
      </div>

      <form action={action} className="mt-6 grid gap-5">
        <input type="hidden" name="organizationId" value={organization.id} />
        <div className="grid gap-4 lg:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">Full name
            <input name="displayName" required maxLength={160} autoComplete="name" placeholder="Mike Smith" className="portal-field mt-2 w-full px-3 py-3 text-sm normal-case tracking-normal" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">Email address
            <input name="email" type="email" required maxLength={320} autoComplete="email" placeholder="mike@example.com" className="portal-field mt-2 w-full px-3 py-3 text-sm normal-case tracking-normal" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">Customer role
            <select name="organizationRole" defaultValue="viewer" className="portal-field mt-2 w-full px-3 py-3 text-sm normal-case tracking-normal">
              {Object.entries(organizationRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
        </div>

        <fieldset>
          <legend className="text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">Service access</legend>
          <div className="mt-2 grid gap-3 xl:grid-cols-3">
            {d2dProducts.map((product) => {
              const active = entitlements.some((item) => item.organization_id === organization.id && item.product === product.value && item.status === "active");
              const selected = Boolean(selectedProducts[product.value]);
              return (
                <label key={product.value} className={`rounded-xl border p-4 ${active ? "border-[#241c17]/12 bg-white/45" : "border-[#241c17]/8 bg-[#241c17]/[0.025] opacity-60"}`}>
                  <span className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      name={`product_${product.value}`}
                      checked={selected}
                      disabled={!active}
                      onChange={(event) => setSelectedProducts((current) => ({ ...current, [product.value]: event.target.checked }))}
                      className="mt-1 size-4 accent-[#315d4b]"
                    />
                    <span><span className="block text-sm font-semibold">{product.label}</span><span className="mt-1 block text-xs leading-5 text-[#74685e]">{active ? "Choose an access level" : "Turn this customer service on first"}</span></span>
                  </span>
                  <select name={`role_${product.value}`} defaultValue={product.defaultCustomerRole} disabled={!active || !selected} aria-label={`${product.label} access level`} className="portal-field mt-3 w-full px-3 py-2 text-sm disabled:opacity-45">
                    {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
              );
            })}
          </div>
        </fieldset>
        {!identityProvisioningReady ? <p className="rounded-lg border border-amber-800/15 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-900">You can assign anyone who already has a D2D Account. Creating a brand-new account will become available when the secure D2D identity connection is added during release setup.</p> : null}
        <div className="flex flex-wrap items-center gap-4"><AddPersonButton /><p className="text-xs text-[#74685e]">The person receives only the services selected above.</p></div>
        <Feedback state={state} />
      </form>
    </section>
  );
}

function PersonSummary({
  organizationId,
  person,
  organizationRole,
  instructionsEmailReady,
}: {
  organizationId: string;
  person: Profile;
  organizationRole: string;
  instructionsEmailReady: boolean;
}) {
  const [state, action] = useActionState(setOrganizationMemberRoleAction, initialState);
  const [emailState, emailAction] = useActionState(sendClientInstructionsAction, initialState);
  return (
    <div className="grid gap-4 border-b border-[#241c17]/10 pb-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,28rem)] lg:items-end">
      <div>
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-full bg-[#315d4b] text-white"><UserRoundCheck size={17} /></span>
          <div><p className="font-semibold">{person.display_name || person.email}</p><p className="text-xs text-[#74685e]">{person.email}</p></div>
        </div>
        <form action={emailAction} className="mt-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="userId" value={person.id} />
          <SendInstructionsButton disabled={!instructionsEmailReady} />
          <p className="mt-2 text-xs leading-5 text-[#74685e]">
            {instructionsEmailReady
              ? "Sends the secure sign-in link, first-login steps, and this person’s active services."
              : "Add the portal email delivery settings before sending instructions."}
          </p>
          <Feedback state={emailState} />
        </form>
      </div>
      <form action={action} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="userId" value={person.id} />
        <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d6258]">Customer role
          <select name="organizationRole" defaultValue={organizationRole} className="portal-field mt-1.5 w-full px-3 py-2 text-sm normal-case tracking-normal">
            {Object.entries(organizationRoleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <div className="self-end"><SubmitButton active={false} activeLabel="" inactiveLabel="Save role" /></div>
        <div className="sm:col-span-2"><Feedback state={state} /></div>
      </form>
    </div>
  );
}

function SendInstructionsButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="portal-secondary-button inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
    >
      <Mail size={15} />
      {pending ? "Sending…" : "Email login instructions"}
    </button>
  );
}

function OrganizationProductCard({ organizationId, product, entitlement }: { organizationId: string; product: D2DProductDefinition; entitlement?: Entitlement }) {
  const [state, action] = useActionState(setEntitlementAction, initialState);
  const active = entitlement?.status === "active";
  return (
    <article className={`portal-panel relative overflow-hidden border p-5 ${active ? "border-emerald-800/25" : "border-[#241c17]/10"}`}>
      <div className={`absolute inset-y-0 left-0 w-1 ${active ? "bg-emerald-700" : "bg-[#241c17]/12"}`} />
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#8a7b70]">Organization service</p>
          <h3 className="mt-2 font-display text-2xl font-semibold">{product.label}</h3>
        </div>
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${active ? "bg-emerald-100 text-emerald-800" : "bg-[#2b211b]/6 text-[#6d6258]"}`}>
          {active ? <Check size={12} /> : <Power size={12} />}{active ? "On" : "Off"}
        </span>
      </div>
      <p className="mt-3 min-h-12 text-sm leading-6 text-[#6d6258]">{product.description}</p>
      <form action={action} className="mt-5">
        <input type="hidden" name="organizationId" value={organizationId} />
        <input type="hidden" name="product" value={product.value} />
        <input type="hidden" name="enabled" value={active ? "false" : "true"} />
        <SubmitButton active={active} activeLabel="Turn off" inactiveLabel="Turn on" toggle />
        <Feedback state={state} />
      </form>
    </article>
  );
}

function PersonProductCard({ organizationId, userId, product, entitlement, membership }: { organizationId: string; userId: string; product: D2DProductDefinition; entitlement?: Entitlement; membership?: Membership }) {
  const [grantState, grantAction] = useActionState(setProductMemberAction, initialState);
  const [removeState, removeAction] = useActionState(removeProductMemberAction, initialState);
  const serviceActive = entitlement?.status === "active";
  const assigned = Boolean(membership);
  const role = (membership?.role ?? product.defaultCustomerRole) as ProductRole;

  return (
    <article className={`rounded-xl border p-4 ${assigned && serviceActive ? "border-emerald-800/25 bg-emerald-50/45" : "border-[#241c17]/10 bg-white/35"}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold text-[#241c17]">{product.label}</h3>
          <p className="mt-1 text-xs leading-5 text-[#74685e]">
            {assigned ? `${roleLabels[role]} access${serviceActive ? "" : " — paused while the service is off"}` : serviceActive ? "No access yet" : "Turn on the organization service first"}
          </p>
        </div>
        <span className={`mt-0.5 size-2.5 rounded-full ${assigned && serviceActive ? "bg-emerald-600" : "bg-[#241c17]/16"}`} aria-hidden="true" />
      </div>

      {assigned ? (
        <div className="mt-4 grid gap-3">
          <form action={grantAction} className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="product" value={product.value} />
            <label className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6d6258]">
              Access level
              <select name="role" defaultValue={role} className="portal-field mt-1.5 w-full px-3 py-2 text-sm normal-case tracking-normal">
                {Object.entries(roleLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
            <div className="self-end"><SubmitButton active={false} activeLabel="" inactiveLabel="Save level" /></div>
            <div className="sm:col-span-2"><Feedback state={grantState} /></div>
          </form>
          <form action={removeAction}>
            <input type="hidden" name="organizationId" value={organizationId} />
            <input type="hidden" name="userId" value={userId} />
            <input type="hidden" name="product" value={product.value} />
            <button className="text-xs font-semibold text-red-700 underline decoration-red-700/30 underline-offset-4">Remove access</button>
            <Feedback state={removeState} />
          </form>
        </div>
      ) : (
        <form action={grantAction} className="mt-4">
          <input type="hidden" name="organizationId" value={organizationId} />
          <input type="hidden" name="userId" value={userId} />
          <input type="hidden" name="product" value={product.value} />
          <input type="hidden" name="role" value={product.defaultCustomerRole} />
          <SubmitButton active={false} activeLabel="" inactiveLabel="Give access" disabled={!serviceActive} />
          <Feedback state={grantState} />
        </form>
      )}
    </article>
  );
}

function OrganizationAccess({ organization, profiles, organizationMembers, entitlements, memberships, identityProvisioningReady, instructionsEmailReady }: { organization: Organization; profiles: Profile[]; organizationMembers: OrganizationMember[]; entitlements: Entitlement[]; memberships: Membership[]; identityProvisioningReady: boolean; instructionsEmailReady: boolean }) {
  const people = organizationMembers
    .filter((member) => member.organization_id === organization.id)
    .map((member) => profiles.find((profile) => profile.id === member.user_id))
    .filter((profile): profile is Profile => Boolean(profile));
  const [selectedUserId, setSelectedUserId] = useState(people[0]?.id ?? "");
  const selectedPerson = people.find((person) => person.id === selectedUserId);
  const selectedOrganizationMember = organizationMembers.find((member) => member.organization_id === organization.id && member.user_id === selectedUserId);

  return (
    <div className="space-y-10">
      <section aria-labelledby="organization-services-heading">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#9a5f34]/10 text-[#8b512b]"><Building2 size={18} /></span>
          <div>
            <h2 id="organization-services-heading" className="font-display text-3xl font-semibold">Services for {organization.name}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6d6258]">Turn on every service this customer organization should be able to use. Turning one off pauses it for everyone without deleting their individual assignments.</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 xl:grid-cols-3">
          {d2dProducts.map((product) => (
            <OrganizationProductCard
              key={product.value}
              organizationId={organization.id}
              product={product}
              entitlement={entitlements.find((item) => item.organization_id === organization.id && item.product === product.value)}
            />
          ))}
        </div>
      </section>

      <section aria-labelledby="people-access-heading" className="border-t border-[#241c17]/12 pt-9">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#315d4b]/10 text-[#315d4b]"><UsersRound size={18} /></span>
          <div>
            <h2 id="people-access-heading" className="font-display text-3xl font-semibold">Access by person</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6d6258]">Add a person or choose an existing one, then use the three service cards to adjust access.</p>
          </div>
        </div>

        <AddPersonForm
          organization={organization}
          entitlements={entitlements}
          identityProvisioningReady={identityProvisioningReady}
          onAdded={setSelectedUserId}
        />

        {people.length ? (
          <div className="mt-5 portal-panel border p-5 sm:p-6">
            <label className="block max-w-xl text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">
              Person
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="portal-field mt-2 w-full px-3 py-3 text-sm normal-case tracking-normal">
                {people.map((person) => <option key={person.id} value={person.id}>{person.display_name || person.email} — {person.email}</option>)}
              </select>
            </label>
            {selectedPerson ? (
              <div className="mt-6">
                <PersonSummary
                  organizationId={organization.id}
                  person={selectedPerson}
                  organizationRole={selectedOrganizationMember?.role ?? "viewer"}
                  instructionsEmailReady={instructionsEmailReady}
                />
                <div className="mt-4 grid gap-3 xl:grid-cols-3">
                  {d2dProducts.map((product) => (
                    <PersonProductCard
                      key={`${selectedPerson.id}-${product.value}`}
                      organizationId={organization.id}
                      userId={selectedPerson.id}
                      product={product}
                      entitlement={entitlements.find((item) => item.organization_id === organization.id && item.product === product.value)}
                      membership={memberships.find((item) => item.organization_id === organization.id && item.user_id === selectedPerson.id && item.product === product.value)}
                    />
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="portal-panel mt-4 flex items-start gap-3 border p-5 text-sm leading-6 text-[#6d6258]">
            <LockKeyhole className="mt-0.5 shrink-0 text-[#9a5f34]" size={18} />
            No people have been added to this customer yet. Use the form above to create the first assignment.
          </div>
        )}
      </section>
    </div>
  );
}

export function ProductAccessAdmin({
  organizations,
  profiles,
  organizationMembers,
  entitlements,
  memberships,
  dashboard,
  identityProvisioningReady,
  instructionsEmailReady,
}: {
  organizations: Organization[];
  profiles: Profile[];
  organizationMembers: OrganizationMember[];
  entitlements: Entitlement[];
  memberships: Membership[];
  dashboard: AdminDashboardData;
  identityProvisioningReady: boolean;
  instructionsEmailReady: boolean;
}) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(organizations[0]?.id ?? "");
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);

  return (
    <div className="space-y-9">
      <header className="border-b border-[#241c17]/12 pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">Platform administration</p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Administration headquarters</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d6258]">Add customers and people, assign every D2D service from one place, and monitor account activity and file usage.</p>
      </header>

      <DashboardOverview dashboard={dashboard} />

      <CreateCustomerForm onCreated={setSelectedOrganizationId} />

      {organizations.length ? (
        <>
          <section className="portal-panel border p-5 sm:p-6" aria-labelledby="choose-organization-heading">
            <div className="grid items-end gap-4 lg:grid-cols-[minmax(0,32rem)_1fr]">
              <label id="choose-organization-heading" className="text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">
                Customer organization
                <select value={selectedOrganizationId} onChange={(event) => setSelectedOrganizationId(event.target.value)} className="portal-field mt-2 w-full px-3 py-3 text-sm normal-case tracking-normal">
                  {organizations.map((organization) => <option key={organization.id} value={organization.id}>{organization.name}</option>)}
                </select>
              </label>
              <p className="text-sm leading-6 text-[#74685e]">Changes are saved immediately and recorded in the platform audit log.</p>
            </div>
          </section>
          {selectedOrganization ? (
            <OrganizationAccess
              key={selectedOrganization.id}
              organization={selectedOrganization}
              profiles={profiles}
              organizationMembers={organizationMembers}
              entitlements={entitlements}
              memberships={memberships}
              identityProvisioningReady={identityProvisioningReady}
              instructionsEmailReady={instructionsEmailReady}
            />
          ) : null}
        </>
      ) : (
        <p className="portal-panel border p-6 text-sm text-[#6d6258]">No active customer organizations are available.</p>
      )}
    </div>
  );
}
