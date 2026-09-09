import "server-only";

type KeycloakUser = { id: string; email?: string; username?: string };

export type ProvisionedD2DIdentity = {
  created: boolean;
  activationEmailSent: boolean;
};

export function isD2DIdentityProvisioningConfigured() {
  return Boolean(
    process.env.KEYCLOAK_ADMIN_CLIENT_ID
    && process.env.KEYCLOAK_ADMIN_CLIENT_SECRET
    && (process.env.KEYCLOAK_ADMIN_BASE_URL ?? "https://account.d2dperformance.com")
    && (process.env.KEYCLOAK_ADMIN_REALM ?? "d2d"),
  );
}

async function responseMessage(response: Response, fallback: string) {
  const body = await response.text();
  if (!body) return fallback;
  try {
    const parsed = JSON.parse(body) as { error_description?: string; errorMessage?: string; error?: string };
    return parsed.error_description ?? parsed.errorMessage ?? parsed.error ?? fallback;
  } catch {
    return fallback;
  }
}

export async function provisionD2DIdentity(input: {
  email: string;
  displayName: string;
}): Promise<ProvisionedD2DIdentity> {
  if (!isD2DIdentityProvisioningConfigured()) {
    throw new Error("D2D Account user creation is not connected yet. Add the Keycloak administrator credentials before inviting customers.");
  }

  const baseUrl = (process.env.KEYCLOAK_ADMIN_BASE_URL ?? "https://account.d2dperformance.com").replace(/\/$/, "");
  const realm = process.env.KEYCLOAK_ADMIN_REALM ?? "d2d";
  const adminClientId = process.env.KEYCLOAK_ADMIN_CLIENT_ID!;
  const adminClientSecret = process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!;
  const tokenResponse = await fetch(`${baseUrl}/realms/${encodeURIComponent(realm)}/protocol/openid-connect/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: adminClientId,
      client_secret: adminClientSecret,
    }),
    cache: "no-store",
  });
  if (!tokenResponse.ok) throw new Error(await responseMessage(tokenResponse, "D2D Account administrator authentication failed."));
  const token = (await tokenResponse.json() as { access_token?: string }).access_token;
  if (!token) throw new Error("D2D Account did not return an administrator token.");

  const headers = { authorization: `Bearer ${token}`, "content-type": "application/json" };
  const lookupResponse = await fetch(`${baseUrl}/admin/realms/${encodeURIComponent(realm)}/users?email=${encodeURIComponent(input.email)}&exact=true&max=2`, {
    headers,
    cache: "no-store",
  });
  if (!lookupResponse.ok) throw new Error(await responseMessage(lookupResponse, "D2D Account could not check for an existing user."));
  let users = await lookupResponse.json() as KeycloakUser[];
  let created = false;

  if (!users.length) {
    const [firstName, ...rest] = input.displayName.trim().split(/\s+/);
    const createResponse = await fetch(`${baseUrl}/admin/realms/${encodeURIComponent(realm)}/users`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        username: input.email,
        email: input.email,
        emailVerified: true,
        enabled: true,
        firstName: firstName || input.displayName,
        lastName: rest.join(" "),
        requiredActions: ["UPDATE_PASSWORD"],
      }),
      cache: "no-store",
    });
    if (!createResponse.ok) throw new Error(await responseMessage(createResponse, "D2D Account could not create this user."));
    created = true;

    const createdLocation = createResponse.headers.get("location");
    const createdId = createdLocation?.split("/").pop();
    users = createdId ? [{ id: createdId, email: input.email }] : [];
  }

  const userId = users[0]?.id;
  if (!userId) throw new Error("D2D Account created the user but did not return its identifier.");
  if (!created) return { created: false, activationEmailSent: false };

  const activationResponse = await fetch(
    `${baseUrl}/admin/realms/${encodeURIComponent(realm)}/users/${encodeURIComponent(userId)}/execute-actions-email`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify(["UPDATE_PASSWORD"]),
      cache: "no-store",
    },
  );

  return { created: true, activationEmailSent: activationResponse.ok };
}
