import type { SiteRole, UserAccess } from "@/lib/site-manager/types";

const roleRank: Record<SiteRole, number> = {
  viewer: 0,
  editor: 1,
  publisher: 2,
  site_admin: 3,
};

export function hasRole(access: UserAccess, minimum: SiteRole) {
  return access.isPlatformAdmin || (access.role !== null && roleRank[access.role] >= roleRank[minimum]);
}

export function canEdit(access: UserAccess) {
  return access.isPlatformAdmin || access.role === "editor" || access.role === "publisher" || access.role === "site_admin";
}

export function canPublish(access: UserAccess) {
  if (access.isPlatformAdmin || access.role === "publisher") return true;
  return access.role === "site_admin" && access.publishingMode === "client_can_publish";
}

export function canManageUsers(access: UserAccess) {
  return access.isPlatformAdmin || access.role === "site_admin";
}
