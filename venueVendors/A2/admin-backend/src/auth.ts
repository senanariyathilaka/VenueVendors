export interface GraphQLContext {
  token?: string;
}

export function readBearerToken(authorizationHeader?: string | null) {
  if (!authorizationHeader) {
    return "";
  }

  const [scheme, token] = authorizationHeader.split(" ");

  if (!scheme || scheme.toLowerCase() !== "bearer") {
    return "";
  }

  return token ?? "";
}

export function requireAdmin(context: GraphQLContext) {
  const expectedToken = process.env.ADMIN_TOKEN || "admin-static-token";

  if (!context.token || context.token !== expectedToken) {
    throw new Error("Admin authentication required.");
  }
}

export function validateAdminCredentials(username: string, password: string) {
  const expectedUsername = process.env.ADMIN_USERNAME || "admin";
  const expectedPassword = process.env.ADMIN_PASSWORD || "admin";

  return username === expectedUsername && password === expectedPassword;
}