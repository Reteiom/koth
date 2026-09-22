/** Where ipfs:// images are loaded from. */
export const IPFS_GATEWAY = (
  process.env.NEXT_PUBLIC_IPFS_GATEWAY || "https://ipfs.filebase.io/ipfs/"
).replace(/\/?$/, "/");

function cidOf(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed.startsWith("ipfs://")) return null;
  return trimmed.slice("ipfs://".length).replace(/^ipfs\//, "") || null;
}

/** Turns a stored image reference into something an <img> can load. */
export function imageUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const cid = cidOf(value);
  if (cid) return IPFS_GATEWAY + cid;
  return /^https?:\/\//.test(value.trim()) ? value.trim() : null;
}

/**
 * Same image through our own proxy. Used when the gateway refuses the browser
 * (rate limits or a same-origin resource policy).
 */
export function imageFallbackUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  const cid = cidOf(value);
  return cid ? `/api/ipfs/${cid}` : null;
}
