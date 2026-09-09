"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getD2DProduct } from "@/lib/d2d-platform/products";
import { customerSlugFromName } from "@/lib/d2d-platform/organizations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/site-manager/access";

export type ProductAdminState = {
  error?: string;
  message?: string;
  organizationId?: string;
};

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

export async function createCustomerOrganizationAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const { name } = z.object({
      name: z.string().trim().min(1, "Enter a customer name.").max(160),
    }).parse({ name: formData.get("name") });
    const slug = customerSlugFromName(name);
    if (!slug) return { error: "Enter a customer name with at least one letter or number." };

    const supabase = await requirePlatformAdmin();
    const { data, error } = await supabase.rpc("admin_create_customer_organization", {
      check_name: name,
      check_slug: slug,
    });
    if (error) throw new Error(error.message);
    if (!data?.id) throw new Error("The customer was created, but could not be opened.");

    revalidatePath("/portal/admin/products");
    return {
      message: `${name} was added. All services are off until you turn them on.`,
      organizationId: data.id,
    };
  } catch (error) {
    return failure(error);
  }
}

export async function setEntitlementAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const input = z.object({
      organizationId: z.string().uuid(),
      product: productSchema,
      enabled: z.enum(["true", "false"]).transform((value) => value === "true"),
    }).parse({
      organizationId: formData.get("organizationId"),
      product: formData.get("product"),
      enabled: formData.get("enabled"),
    });
    const supabase = await requirePlatformAdmin();
    const { data: existing, error: lookupError } = await supabase
      .from("product_entitlements")
      .select("launch_url,external_workspace_id")
      .eq("organization_id", input.organizationId)
      .eq("product", input.product)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    const product = getD2DProduct(input.product);
    const { error } = await supabase.rpc("admin_set_product_entitlement", {
      check_organization: input.organizationId,
      check_product: input.product,
      check_status: input.enabled ? "active" : "suspended",
      check_launch_url: existing?.launch_url ?? product.defaultLaunchUrl,
      check_external_workspace_id: existing?.external_workspace_id ?? null,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/admin/products");
    revalidatePath("/portal/dashboard");
    return { message: `${product.label} is ${input.enabled ? "on" : "off"} for this organization.` };
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
    revalidatePath("/portal/dashboard");
    return { message: "This person’s access was saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function removeProductMemberAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const input = z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
      product: productSchema,
    }).parse({
      organizationId: formData.get("organizationId"),
      userId: formData.get("userId"),
      product: formData.get("product"),
    });
    const supabase = await requirePlatformAdmin();
    const { error } = await supabase.rpc("admin_remove_product_member", {
      check_organization: input.organizationId,
      check_user: input.userId,
      check_product: input.product,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/admin/products");
    revalidatePath("/portal/dashboard");
    return { message: "This person’s access was removed." };
  } catch (error) {
    return failure(error);
  }
}
