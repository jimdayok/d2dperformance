"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/site-manager/access";

export type ProductAdminState = { error?: string; message?: string };

const productSchema = z.enum(["social", "brand_vault", "web_management"]);

async function requirePlatformAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in again to continue.");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).single();
  if (!data?.is_platform_admin) throw new Error("Platform administrator access is required.");
  return supabase;
}

function failure(error: unknown): ProductAdminState {
  return { error: error instanceof Error ? error.message : "The change could not be saved." };
}

export async function setEntitlementAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const input = z.object({
      organizationId: z.string().uuid(),
      product: productSchema,
      status: z.enum(["active", "suspended", "archived"]),
      launchUrl: z.string().url().refine((value) => value.startsWith("https://"), "Launch URL must use HTTPS."),
      externalWorkspaceId: z.string().trim().max(240),
    }).parse({
      organizationId: formData.get("organizationId"),
      product: formData.get("product"),
      status: formData.get("status"),
      launchUrl: formData.get("launchUrl"),
      externalWorkspaceId: formData.get("externalWorkspaceId") ?? "",
    });
    const supabase = await requirePlatformAdmin();
    const { error } = await supabase.rpc("admin_set_product_entitlement", {
      check_organization: input.organizationId,
      check_product: input.product,
      check_status: input.status,
      check_launch_url: input.launchUrl,
      check_external_workspace_id: input.externalWorkspaceId || null,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/admin/products");
    revalidatePath("/portal/dashboard");
    return { message: "Customer product access was saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function setProductMemberAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const input = z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
      product: productSchema,
      role: z.enum(["manager", "creator", "reviewer", "viewer"]),
    }).parse({
      organizationId: formData.get("organizationId"),
      userId: formData.get("userId"),
      product: formData.get("product"),
      role: formData.get("role"),
    });
    const supabase = await requirePlatformAdmin();
    const { error } = await supabase.rpc("admin_set_product_member", {
      check_organization: input.organizationId,
      check_user: input.userId,
      check_product: input.product,
      check_role: input.role,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/admin/products");
    return { message: "The customer role was saved." };
  } catch (error) {
    return failure(error);
  }
}
