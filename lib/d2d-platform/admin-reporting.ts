import "server-only";

import { createClient } from "@supabase/supabase-js";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type AdminUserActivity = {
  id: string;
  email: string;
  displayName: string;
  lastSignInAt: string | null;
  invitedAt: string | null;
  createdAt: string;
};

export type AdminFileUsage = {
  organizationId: string | null;
  organizationName: string;
  webFiles: number;
  webBytes: number;
  vaultFiles: number;
  vaultBytes: number;
};

export type AdminActivity = {
  id: string;
  action: string;
  organizationName: string;
  actorName: string;
  createdAt: string;
};

export type AdminDashboardData = {
  customers: number;
  users: number;
  signedInLast30Days: number;
  pendingActivation: number;
  enabledServices: number;
  totalFiles: number;
  totalBytes: number;
  vaultConnected: boolean;
  usersActivity: AdminUserActivity[];
  fileUsage: AdminFileUsage[];
  recentActivity: AdminActivity[];
};

type VaultOrganization = { id: string; slug: string; name: string };
type VaultVersion = { organization_id: string; file_size_bytes: number };

async function getVaultUsage() {
  const url = process.env.BRAND_VAULT_SUPABASE_URL;
  const key = process.env.BRAND_VAULT_SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return { connected: false, bySlug: new Map<string, { files: number; bytes: number }>() };

  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const [{ data: organizations, error: organizationsError }, { data: versions, error: versionsError }] = await Promise.all([
    client.from("organizations").select("id,slug,name").eq("status", "active"),
    client.from("asset_versions").select("organization_id,file_size_bytes"),
  ]);
  if (organizationsError || versionsError) return { connected: false, bySlug: new Map<string, { files: number; bytes: number }>() };

  const vaultOrganizations = (organizations ?? []) as VaultOrganization[];
  const vaultVersions = (versions ?? []) as VaultVersion[];
  const slugById = new Map(vaultOrganizations.map((organization) => [organization.id, organization.slug]));
  const bySlug = new Map<string, { files: number; bytes: number }>();
  for (const version of vaultVersions) {
    const slug = slugById.get(version.organization_id);
    if (!slug) continue;
    const current = bySlug.get(slug) ?? { files: 0, bytes: 0 };
    current.files += 1;
    current.bytes += Number(version.file_size_bytes) || 0;
    bySlug.set(slug, current);
  }
  return { connected: true, bySlug };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const admin = createSupabaseAdminClient();
  const [
    { data: organizations, error: organizationsError },
    { data: profiles, error: profilesError },
    { data: organizationMembers, error: membersError },
    { data: entitlements, error: entitlementsError },
    { data: mediaAssets, error: mediaError },
    { data: sites, error: sitesError },
    { data: auditEvents, error: auditError },
    authUsers,
    vault,
  ] = await Promise.all([
    admin.from("organizations").select("id,name,slug").eq("status", "active").order("name"),
    admin.from("profiles").select("id,display_name,email,is_platform_admin"),
    admin.from("organization_members").select("organization_id,user_id"),
    admin.from("product_entitlements").select("organization_id").eq("status", "active"),
    admin.from("media_assets").select("site_id,byte_size").is("deleted_at", null),
    admin.from("sites").select("id,organization_id"),
    admin.from("platform_audit_events").select("id,organization_id,actor_id,action,created_at").order("created_at", { ascending: false }).limit(12),
    admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
    getVaultUsage(),
  ]);
  const reportingError = organizationsError ?? profilesError ?? membersError ?? entitlementsError ?? mediaError ?? sitesError ?? auditError ?? authUsers.error;
  if (reportingError) throw new Error(`Administration reporting could not be loaded: ${reportingError.message}`);

  const profileById = new Map((profiles ?? []).map((profile) => [profile.id, profile]));
  const organizationById = new Map((organizations ?? []).map((organization) => [organization.id, organization]));
  const siteOrganization = new Map((sites ?? []).map((site) => [site.id, site.organization_id]));
  const memberIds = new Set((organizationMembers ?? []).map((membership) => membership.user_id));
  const usersActivity = (authUsers.data?.users ?? [])
    .filter((user) => memberIds.has(user.id) || profileById.get(user.id)?.is_platform_admin)
    .map((user) => ({
      id: user.id,
      email: user.email ?? profileById.get(user.id)?.email ?? "",
      displayName: profileById.get(user.id)?.display_name || String(user.user_metadata?.display_name ?? user.user_metadata?.full_name ?? ""),
      lastSignInAt: user.last_sign_in_at ?? null,
      invitedAt: user.invited_at ?? null,
      createdAt: user.created_at,
    }))
    .sort((left, right) => (right.lastSignInAt ?? right.createdAt).localeCompare(left.lastSignInAt ?? left.createdAt));

  const webByOrganization = new Map<string, { files: number; bytes: number }>();
  for (const asset of mediaAssets ?? []) {
    const organizationId = siteOrganization.get(asset.site_id);
    if (!organizationId) continue;
    const current = webByOrganization.get(organizationId) ?? { files: 0, bytes: 0 };
    current.files += 1;
    current.bytes += Number(asset.byte_size) || 0;
    webByOrganization.set(organizationId, current);
  }

  const fileUsage = (organizations ?? []).map((organization) => {
    const web = webByOrganization.get(organization.id) ?? { files: 0, bytes: 0 };
    const vaultUsage = vault.bySlug.get(organization.slug) ?? { files: 0, bytes: 0 };
    return {
      organizationId: organization.id,
      organizationName: organization.name,
      webFiles: web.files,
      webBytes: web.bytes,
      vaultFiles: vaultUsage.files,
      vaultBytes: vaultUsage.bytes,
    };
  }).sort((left, right) => (right.webFiles + right.vaultFiles) - (left.webFiles + left.vaultFiles));

  const totalFiles = fileUsage.reduce((sum, item) => sum + item.webFiles + item.vaultFiles, 0);
  const totalBytes = fileUsage.reduce((sum, item) => sum + item.webBytes + item.vaultBytes, 0);
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  return {
    customers: organizations?.length ?? 0,
    users: usersActivity.length,
    signedInLast30Days: usersActivity.filter((user) => user.lastSignInAt && Date.parse(user.lastSignInAt) >= thirtyDaysAgo).length,
    pendingActivation: usersActivity.filter((user) => !user.lastSignInAt).length,
    enabledServices: entitlements?.length ?? 0,
    totalFiles,
    totalBytes,
    vaultConnected: vault.connected,
    usersActivity,
    fileUsage,
    recentActivity: (auditEvents ?? []).map((event) => ({
      id: event.id,
      action: event.action,
      organizationName: event.organization_id ? organizationById.get(event.organization_id)?.name ?? "Archived customer" : "Platform",
      actorName: event.actor_id ? profileById.get(event.actor_id)?.display_name || profileById.get(event.actor_id)?.email || "Administrator" : "System",
      createdAt: event.created_at,
    })),
  };
}
