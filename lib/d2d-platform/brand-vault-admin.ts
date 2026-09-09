import "server-only";

import { createClient } from "@supabase/supabase-js";

type VaultRole = "organization_admin" | "editor" | "viewer";

function createBrandVaultAdminClient() {
  const url = process.env.BRAND_VAULT_SUPABASE_URL;
  const key = process.env.BRAND_VAULT_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function isBrandVaultAdministrationConfigured() {
  return Boolean(process.env.BRAND_VAULT_SUPABASE_URL && process.env.BRAND_VAULT_SUPABASE_SERVICE_ROLE_KEY);
}

export async function ensureBrandVaultOrganization(input: { name: string; slug: string }) {
  const vault = createBrandVaultAdminClient();
  if (!vault) return { connected: false, organizationId: null };
  const { data: existing, error: lookupError } = await vault.from("organizations").select("id").eq("slug", input.slug).maybeSingle();
  if (lookupError) throw new Error(`Brand Vault: ${lookupError.message}`);
  if (existing?.id) return { connected: true, organizationId: existing.id as string };
  const { data: created, error: createError } = await vault.from("organizations").insert({
    name: input.name,
    slug: input.slug,
    status: "active",
  }).select("id").single();
  if (createError) throw new Error(`Brand Vault: ${createError.message}`);
  return { connected: true, organizationId: created.id as string };
}

async function findOrCreateVaultUser(email: string, displayName: string) {
  const vault = createBrandVaultAdminClient();
  if (!vault) return null;
  const { data: page, error: listError } = await vault.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw new Error(`Brand Vault: ${listError.message}`);
  const existing = page.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
  if (existing) return { vault, userId: existing.id };
  const { data, error } = await vault.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  if (error || !data.user) throw new Error(`Brand Vault: ${error?.message ?? "customer account could not be prepared"}`);
  return { vault, userId: data.user.id };
}

export async function setBrandVaultMember(input: {
  organizationName: string;
  organizationSlug: string;
  email: string;
  displayName: string;
  role: VaultRole;
}) {
  const user = await findOrCreateVaultUser(input.email, input.displayName);
  if (!user) return { connected: false };
  const organization = await ensureBrandVaultOrganization({ name: input.organizationName, slug: input.organizationSlug });
  if (!organization.organizationId) return { connected: false };
  const { error } = await user.vault.from("organization_members").upsert({
    organization_id: organization.organizationId,
    user_id: user.userId,
    role: input.role,
    status: "active",
    joined_at: new Date().toISOString(),
  }, { onConflict: "organization_id,user_id" });
  if (error) throw new Error(`Brand Vault: ${error.message}`);
  return { connected: true };
}

export async function removeBrandVaultMember(input: { organizationSlug: string; email: string }) {
  const vault = createBrandVaultAdminClient();
  if (!vault) return { connected: false };
  const [{ data: organization, error: organizationError }, { data: page, error: usersError }] = await Promise.all([
    vault.from("organizations").select("id").eq("slug", input.organizationSlug).maybeSingle(),
    vault.auth.admin.listUsers({ page: 1, perPage: 1000 }),
  ]);
  if (organizationError || usersError) throw new Error(`Brand Vault: ${organizationError?.message ?? usersError?.message}`);
  const user = page.users.find((candidate) => candidate.email?.toLowerCase() === input.email.toLowerCase());
  if (!organization?.id || !user) return { connected: true };
  const { error } = await vault.from("organization_members").delete().eq("organization_id", organization.id).eq("user_id", user.id);
  if (error) throw new Error(`Brand Vault: ${error.message}`);
  return { connected: true };
}

export function toBrandVaultRole(role: string): VaultRole {
  if (role === "manager") return "organization_admin";
  if (role === "creator") return "editor";
  return "viewer";
}
