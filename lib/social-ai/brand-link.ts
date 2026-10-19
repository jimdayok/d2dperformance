// Verified identities in the Social and Vault production customer snapshots.
const vaultSlugs:Record<string,string>={"209800de-4a2e-41cd-99a7-53bdf5fff3d1":"d2dmktg"};
export function vaultSlug(organizationId:string,organizationSlug:string,launchUrl?:string|null,staging=false){
 const parts=launchUrl?new URL(launchUrl).pathname.split("/").filter(Boolean):[];
 const linkedSlug=parts.length===2&&parts[0]==="app"?parts[1]:undefined;
 // Explicit tenant links take precedence; never match tenants by display name.
 return linkedSlug||(staging?organizationSlug:vaultSlugs[organizationId]||organizationSlug);
}
