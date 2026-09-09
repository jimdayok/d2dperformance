"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, Check, LockKeyhole, Power, UserRoundCheck, UsersRound } from "lucide-react";
import {
  removeProductMemberAction,
  setEntitlementAction,
  setProductMemberAction,
  type ProductAdminState,
} from "@/app/(portal)/portal/(authenticated)/admin/products/actions";
import { d2dProducts, type D2DProductDefinition } from "@/lib/d2d-platform/products";
import type { ProductRole } from "@/lib/d2d-platform/types";

type Organization = { id: string; name: string };
type Profile = { id: string; display_name: string; email: string };
type OrganizationMember = { organization_id: string; user_id: string };
type Entitlement = { id: string; organization_id: string; product: string; status: string };
type Membership = { id: string; organization_id: string; user_id: string; product: string; role: string };

const initialState: ProductAdminState = {};
const roleLabels: Record<ProductRole, string> = {
  manager: "Manager",
  creator: "Creator",
  reviewer: "Reviewer",
  viewer: "Viewer",
};

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

function OrganizationAccess({ organization, profiles, organizationMembers, entitlements, memberships }: { organization: Organization; profiles: Profile[]; organizationMembers: OrganizationMember[]; entitlements: Entitlement[]; memberships: Membership[] }) {
  const people = organizationMembers
    .filter((member) => member.organization_id === organization.id)
    .map((member) => profiles.find((profile) => profile.id === member.user_id))
    .filter((profile): profile is Profile => Boolean(profile));
  const [selectedUserId, setSelectedUserId] = useState(people[0]?.id ?? "");
  const selectedPerson = people.find((person) => person.id === selectedUserId);

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
            <p className="mt-1 max-w-2xl text-sm leading-6 text-[#6d6258]">Choose a customer, then use the three service cards to give or remove access.</p>
          </div>
        </div>

        {people.length ? (
          <div className="mt-5 portal-panel border p-5 sm:p-6">
            <label className="block max-w-xl text-xs font-semibold uppercase tracking-[0.13em] text-[#5d5148]">
              Customer
              <select value={selectedUserId} onChange={(event) => setSelectedUserId(event.target.value)} className="portal-field mt-2 w-full px-3 py-3 text-sm normal-case tracking-normal">
                {people.map((person) => <option key={person.id} value={person.id}>{person.display_name || person.email} — {person.email}</option>)}
              </select>
            </label>
            {selectedPerson ? (
              <div className="mt-6">
                <div className="flex items-center gap-3 border-b border-[#241c17]/10 pb-4">
                  <span className="grid size-9 place-items-center rounded-full bg-[#315d4b] text-white"><UserRoundCheck size={17} /></span>
                  <div><p className="font-semibold">{selectedPerson.display_name || selectedPerson.email}</p><p className="text-xs text-[#74685e]">{selectedPerson.email}</p></div>
                </div>
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
          <div className="portal-panel mt-5 flex items-start gap-3 border p-5 text-sm leading-6 text-[#6d6258]">
            <LockKeyhole className="mt-0.5 shrink-0 text-[#9a5f34]" size={18} />
            Add this customer to the organization before assigning service access.
          </div>
        )}
      </section>
    </div>
  );
}

export function ProductAccessAdmin({ organizations, profiles, organizationMembers, entitlements, memberships }: { organizations: Organization[]; profiles: Profile[]; organizationMembers: OrganizationMember[]; entitlements: Entitlement[]; memberships: Membership[] }) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState(organizations[0]?.id ?? "");
  const selectedOrganization = organizations.find((organization) => organization.id === selectedOrganizationId);

  return (
    <div className="space-y-9">
      <header className="border-b border-[#241c17]/12 pb-7">
        <p className="text-[10px] font-semibold uppercase tracking-[0.28em] text-[#9a5f34]">Platform administration</p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">Customer access</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#6d6258]">Choose a customer organization, turn its D2D services on or off, and control what each person can open after signing in.</p>
      </header>

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
            />
          ) : null}
        </>
      ) : (
        <p className="portal-panel border p-6 text-sm text-[#6d6258]">No active customer organizations are available.</p>
      )}
    </div>
  );
}
