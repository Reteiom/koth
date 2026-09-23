/**
 * Vercel Blob credentials, resolved from whatever the project was given.
 * Server-only: these read secrets from the environment.
 */

/**
 * Vercel names the token after the store it belongs to (BLOB_READ_WRITE_TOKEN,
 * but also e.g. PEAK_READ_WRITE_TOKEN), so any of them is accepted.
 */
export function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [name, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (name.endsWith("_READ_WRITE_TOKEN") || value.startsWith("vercel_blob_rw_")) return value;
  }
  return undefined;
}

/**
 * Newer Blob connections carry no token at all: Vercel adds BLOB_STORE_ID and
 * the SDK authenticates with the deployment's OIDC token. A store id under a
 * custom prefix is accepted too and passed explicitly.
 */
export function blobStoreId(): string | undefined {
  if (process.env.BLOB_STORE_ID) return process.env.BLOB_STORE_ID;
  for (const [name, value] of Object.entries(process.env)) {
    if (value && name.endsWith("STORE_ID") && value.startsWith("store_")) return value;
  }
  return undefined;
}

/** A read-write token when there is one; otherwise OIDC with the store id. */
export function blobAuth(): { token: string } | { storeId: string | undefined } {
  const token = blobToken();
  return token ? { token } : { storeId: blobStoreId() };
}

/** Where images uploaded to a private store are served from. */
export const PRIVATE_IMAGE_PREFIX = "tokens/";
