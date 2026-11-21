"use strict";

class IdentityError extends Error {
  constructor(code, status = 401) {
    super(code);
    this.name = "IdentityError";
    this.code = code;
    this.status = status;
  }
}

class IdentityProvider {
  async verifyIdentity() {
    throw new IdentityError("identity_provider_unavailable", 503);
  }
}

class SarhIdentityProvider extends IdentityProvider {
  async verifyIdentity() {
    throw new IdentityError("sarh_identity_contract_unavailable", 503);
  }
}

function createTestIdentityProvider() {
  if (process.env.NODE_ENV !== "test" || process.env.VERCEL === "1" || process.env.VERCEL_ENV === "production") {
    throw new Error("test_identity_provider_is_test_only");
  }

  const testPrincipals = new Map([
    ["test-token-user-a", {
      issuer: "https://mihwar.test.invalid",
      subject: "user-a",
      mihwarUserId: "00000000-0000-4000-8000-000000000001",
      databaseAccessToken: "test-database-token-a",
      permissions: ["data:read", "data:write"]
    }],
    ["test-token-user-b", {
      issuer: "https://mihwar.test.invalid",
      subject: "user-b",
      mihwarUserId: "00000000-0000-4000-8000-000000000002",
      databaseAccessToken: "test-database-token-b",
      permissions: ["data:read", "data:write"]
    }]
  ]);

  return {
    async verifyIdentity(token) {
      const identity = testPrincipals.get(token);
      if (!identity) throw new IdentityError("unauthenticated");
      return Object.freeze({ ...identity });
    }
  };
}

function bearerToken(request) {
  const authorization = request.headers?.authorization || request.headers?.Authorization;
  const match = typeof authorization === "string" && authorization.match(/^Bearer ([^\s]+)$/i);
  if (!match) throw new IdentityError("unauthenticated");
  return match[1];
}

async function verifyIdentity(request, provider) {
  if (!provider || typeof provider.verifyIdentity !== "function") {
    throw new IdentityError("identity_provider_unavailable", 503);
  }
  const identity = await provider.verifyIdentity(bearerToken(request));
  if (
    !identity ||
    typeof identity.issuer !== "string" ||
    typeof identity.subject !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(identity.mihwarUserId)
  ) {
    throw new IdentityError("invalid_verified_identity", 401);
  }
  return Object.freeze({
    issuer: identity.issuer,
    subject: identity.subject,
    mihwarUserId: identity.mihwarUserId,
    databaseAccessToken: identity.databaseAccessToken,
    permissions: Object.freeze(Array.isArray(identity.permissions) ? [...identity.permissions] : [])
  });
}

async function getAuthenticatedUser(request, provider) {
  return verifyIdentity(request, provider);
}

function requirePermission(user, permission) {
  if (!user?.permissions?.includes(permission)) {
    throw new IdentityError("forbidden", 403);
  }
  return user;
}

async function resolveMihwarProfile(identity, env = process.env, fetchImpl = fetch) {
  if (!identity?.databaseAccessToken) {
    throw new IdentityError("database_identity_unavailable", 503);
  }
  const baseUrl = env.MIHWAR_SUPABASE_URL;
  const publicKey = env.MIHWAR_SUPABASE_ANON_KEY;
  if (!baseUrl || !publicKey) {
    throw new IdentityError("database_configuration_unavailable", 503);
  }

  const url = new URL("/rest/v1/mihwer_users", baseUrl);
  url.searchParams.set("id", `eq.${identity.mihwarUserId}`);
  url.searchParams.set("select", "id,status");
  const response = await fetchImpl(url, {
    headers: {
      apikey: publicKey,
      authorization: `Bearer ${identity.databaseAccessToken}`,
      accept: "application/json"
    }
  });
  if (!response.ok) throw new IdentityError("profile_lookup_failed", response.status === 401 ? 401 : 503);
  const profiles = await response.json();
  const profile = Array.isArray(profiles) ? profiles[0] : null;
  if (!profile || profile.id !== identity.mihwarUserId || profile.status !== "active") {
    throw new IdentityError("profile_unavailable", 403);
  }
  return Object.freeze({ id: profile.id, status: profile.status });
}

module.exports = {
  IdentityError,
  IdentityProvider,
  SarhIdentityProvider,
  createTestIdentityProvider,
  verifyIdentity,
  getAuthenticatedUser,
  resolveMihwarProfile,
  requirePermission
};
