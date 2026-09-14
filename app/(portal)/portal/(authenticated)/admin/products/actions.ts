"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getD2DProduct } from "@/lib/d2d-platform/products";
import { customerSlugFromName } from "@/lib/d2d-platform/organizations";
import { provisionD2DIdentity } from "@/lib/d2d-platform/keycloak-admin";
import { sendClientInstructionsEmail } from "@/lib/d2d-platform/client-instructions-email";
import {
  ensureBrandVaultOrganization,
  removeBrandVaultMember,
  setBrandVaultMember,
  toBrandVaultRole,
} from "@/lib/d2d-platform/brand-vault-admin";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/site-manager/access";

export type ProductAdminState = {
  error?: string;
  message?: string;
  organizationId?: string;
  userId?: string;
};

const productSchema = z.enum(["social", "brand_vault", "web_management"]);
const organizationRoleSchema = z.enum(["site_admin", "publisher", "editor", "viewer"]);
const productRoleSchema = z.enum(["manager", "creator", "reviewer", "viewer"]);

async function requirePlatformAdmin() {
  return (await requirePlatformAdminContext()).supabase;
}

async function requirePlatformAdminContext() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Sign in again to continue.");
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase.from("profiles").select("is_platform_admin").eq("id", user.id).single();
  if (!data?.is_platform_admin) throw new Error("Platform administrator access is required.");
  return { supabase, user };
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

export async function addCustomerUserAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const input = z.object({
      organizationId: z.string().uuid(),
      displayName: z.string().trim().min(2, "Enter the person’s name.").max(160),
      email: z.string().trim().toLowerCase().email("Enter a valid email address.").max(320),
      organizationRole: organizationRoleSchema,
    }).parse({
      organizationId: formData.get("organizationId"),
      displayName: formData.get("displayName"),
      email: formData.get("email"),
      organizationRole: formData.get("organizationRole"),
    });

    const productRoles: Record<string, string> = {};
    for (const product of productSchema.options) {
      if (formData.get(`product_${product}`) === "on") {
        productRoles[product] = productRoleSchema.parse(formData.get(`role_${product}`));
      }
    }

    const supabase = await requirePlatformAdmin();
    const selectedProducts = productSchema.options.filter((product) => Boolean(productRoles[product]));
    if (selectedProducts.length) {
      const { data: activeEntitlements, error: entitlementError } = await supabase
        .from("product_entitlements")
        .select("product")
        .eq("organization_id", input.organizationId)
        .eq("status", "active")
        .in("product", selectedProducts);
      if (entitlementError) throw new Error(entitlementError.message);
      const activeProducts = new Set((activeEntitlements ?? []).map((item) => item.product));
      const unavailable = selectedProducts.find((product) => !activeProducts.has(product));
      if (unavailable) throw new Error(`Turn on ${getD2DProduct(unavailable).label} before assigning it.`);
    }

    const { data: existingProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id,display_name,email")
      .ilike("email", input.email)
      .maybeSingle();
    if (profileError) throw new Error(profileError.message);

    let userId = existingProfile?.id;
    let newIdentity = false;
    let activationEmailSent = false;
    if (!userId) {
      const identity = await provisionD2DIdentity({ email: input.email, displayName: input.displayName });
      newIdentity = identity.created;
      activationEmailSent = identity.activationEmailSent;

      const admin = createSupabaseAdminClient();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email: input.email,
        email_confirm: true,
        user_metadata: { display_name: input.displayName },
      });
      if (createError || !created.user) {
        const { data: users } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        userId = users.users.find((user) => user.email?.toLowerCase() === input.email)?.id;
        if (!userId) throw new Error(createError?.message ?? "The D2D Account user could not be created.");
      } else {
        userId = created.user.id;
      }
    }

    const { error: assignmentError } = await supabase.rpc("admin_assign_customer_user", {
      check_organization: input.organizationId,
      check_user: userId,
      check_organization_role: input.organizationRole,
      check_product_roles: productRoles,
    });
    if (assignmentError) throw new Error(assignmentError.message);

    let vaultConnected = true;
    if (productRoles.brand_vault) {
      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("name,slug")
        .eq("id", input.organizationId)
        .single();
      if (organizationError) throw new Error(organizationError.message);
      const vaultResult = await setBrandVaultMember({
        organizationName: organization.name,
        organizationSlug: organization.slug,
        email: input.email,
        displayName: input.displayName,
        role: toBrandVaultRole(productRoles.brand_vault),
      });
      vaultConnected = vaultResult.connected;
    }

    revalidatePath("/portal/admin/products");
    revalidatePath("/portal/dashboard");
    const accountMessage = newIdentity
      ? activationEmailSent
        ? " Their D2D Account activation email was sent."
        : " Their D2D Account was created, but the activation email needs to be resent from the account directory."
      : existingProfile
        ? " Their existing D2D Account was used."
        : " Their existing D2D identity was connected."
    const vaultMessage = productRoles.brand_vault && !vaultConnected
      ? " Brand Vault access is recorded here and will synchronize when its secure connection is enabled."
      : "";
    return { message: `${input.displayName} was added and access was assigned.${accountMessage}${vaultMessage}`, userId };
  } catch (error) {
    return failure(error);
  }
}

export async function sendClientInstructionsAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const input = z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
    }).parse({
      organizationId: formData.get("organizationId"),
      userId: formData.get("userId"),
    });
    const { supabase, user } = await requirePlatformAdminContext();
    const [organizationResult, profileResult, organizationMemberResult, membershipsResult, entitlementsResult] = await Promise.all([
      supabase.from("organizations").select("id,name").eq("id", input.organizationId).eq("status", "active").single(),
      supabase.from("profiles").select("id,display_name,email").eq("id", input.userId).single(),
      supabase.from("organization_members").select("role").eq("organization_id", input.organizationId).eq("user_id", input.userId).maybeSingle(),
      supabase.from("organization_product_members").select("product,role").eq("organization_id", input.organizationId).eq("user_id", input.userId),
      supabase.from("product_entitlements").select("product,status").eq("organization_id", input.organizationId).eq("status", "active"),
    ]);
    const lookupError = organizationResult.error
      ?? profileResult.error
      ?? organizationMemberResult.error
      ?? membershipsResult.error
      ?? entitlementsResult.error;
    if (lookupError) throw new Error(lookupError.message);
    const organization = organizationResult.data;
    const profile = profileResult.data;
    if (!organization || !profile) throw new Error("The selected customer or person could not be found.");
    if (!organizationMemberResult.data) throw new Error("This person is not assigned to that customer.");
    if (!profile.email) throw new Error("This person does not have an email address.");

    const activeProducts = new Set((entitlementsResult.data ?? []).map((entitlement) => entitlement.product));
    const services = (membershipsResult.data ?? []).flatMap((membership) => {
      const product = productSchema.safeParse(membership.product);
      const role = productRoleSchema.safeParse(membership.role);
      if (!product.success || !role.success || !activeProducts.has(product.data)) return [];
      const definition = getD2DProduct(product.data);
      return [{
        product: product.data,
        label: definition.label,
        description: definition.description,
        role: role.data,
      }];
    });
    if (!services.length) throw new Error("Assign at least one active service before sending login instructions.");

    const delivery = await sendClientInstructionsEmail({
      displayName: profile.display_name || profile.email,
      email: profile.email,
      organizationName: organization.name,
      services,
    });
    const admin = createSupabaseAdminClient();
    const { error: auditError } = await admin.from("platform_audit_events").insert({
      organization_id: input.organizationId,
      actor_id: user.id,
      action: "client.instructions_email_sent",
      subject_type: "profile",
      subject_id: input.userId,
      detail: {
        recipient_email: profile.email,
        services: services.map((service) => service.product),
        delivery_id: delivery.id,
      },
    });
    if (auditError) console.error("Client instructions email audit entry failed", auditError);
    revalidatePath("/portal/admin/products");
    return { message: `Login instructions were sent to ${profile.email}.` };
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
    if (input.product === "brand_vault" && input.enabled) {
      const { data: organization, error: organizationError } = await supabase
        .from("organizations")
        .select("name,slug")
        .eq("id", input.organizationId)
        .single();
      if (organizationError) throw new Error(organizationError.message);
      await ensureBrandVaultOrganization({ name: organization.name, slug: organization.slug });
    }
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
    if (input.product === "brand_vault") {
      const [{ data: organization }, { data: profile }] = await Promise.all([
        supabase.from("organizations").select("name,slug").eq("id", input.organizationId).single(),
        supabase.from("profiles").select("display_name,email").eq("id", input.userId).single(),
      ]);
      if (organization && profile) {
        await setBrandVaultMember({
          organizationName: organization.name,
          organizationSlug: organization.slug,
          email: profile.email,
          displayName: profile.display_name || profile.email,
          role: toBrandVaultRole(input.role),
        });
      }
    }
    revalidatePath("/portal/admin/products");
    revalidatePath("/portal/dashboard");
    return { message: "This person’s access was saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function setOrganizationMemberRoleAction(
  _: ProductAdminState,
  formData: FormData,
): Promise<ProductAdminState> {
  try {
    const input = z.object({
      organizationId: z.string().uuid(),
      userId: z.string().uuid(),
      organizationRole: organizationRoleSchema,
    }).parse({
      organizationId: formData.get("organizationId"),
      userId: formData.get("userId"),
      organizationRole: formData.get("organizationRole"),
    });
    const supabase = await requirePlatformAdmin();
    const { data: memberships, error: membershipError } = await supabase
      .from("organization_product_members")
      .select("product,role")
      .eq("organization_id", input.organizationId)
      .eq("user_id", input.userId);
    if (membershipError) throw new Error(membershipError.message);
    const productRoles = Object.fromEntries((memberships ?? []).map((membership) => [membership.product, membership.role]));
    const { error } = await supabase.rpc("admin_assign_customer_user", {
      check_organization: input.organizationId,
      check_user: input.userId,
      check_organization_role: input.organizationRole,
      check_product_roles: productRoles,
    });
    if (error) throw new Error(error.message);
    revalidatePath("/portal/admin/products");
    return { message: "This person’s customer role was saved." };
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
    if (input.product === "brand_vault") {
      const [{ data: organization }, { data: profile }] = await Promise.all([
        supabase.from("organizations").select("slug").eq("id", input.organizationId).single(),
        supabase.from("profiles").select("email").eq("id", input.userId).single(),
      ]);
      if (organization && profile) await removeBrandVaultMember({ organizationSlug: organization.slug, email: profile.email });
    }
    revalidatePath("/portal/admin/products");
    revalidatePath("/portal/dashboard");
    return { message: "This person’s access was removed." };
  } catch (error) {
    return failure(error);
  }
}
