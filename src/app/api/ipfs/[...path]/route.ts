import { NextResponse } from "next/server";

/**
 * Serves token images stored on IPFS.
 *
 * Public gateways block cross-origin image loads, so the bytes are fetched
 * server-side and passed through. Only IPFS paths are proxied — never an
 * arbitrary URL — and only images are returned.
 */
export const revalidate = 86400;

const MAX_BYTES = 5 * 1024 * 1024;

/** Tried in order — public gateways rate limit, so one fallback is not enough. */
const GATEWAYS = (
  process.env.IPFS_GATEWAYS ||
  "https://ipfs.filebase.io/ipfs/,https://4everland.io/ipfs/,https://ipfs.io/ipfs/,https://dweb.link/ipfs/"
)
  .split(",")
  .map((g) => g.trim().replace(/\/?$/, "/"))
  .filter(Boolean);

export async function GET(_request: Request, ctx: RouteContext<"/api/ipfs/[...path]">) {
  const { path } = await ctx.params;
  const cid = path.join("/");
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]*$/.test(cid) || cid.includes("..")) {
    return NextResponse.json({ error: "Invalid IPFS path" }, { status: 400 });
  }

  let upstream: Response | null = null;
  for (const gateway of GATEWAYS) {
    try {
      const res = await fetch(`${gateway}${cid}`, { signal: AbortSignal.timeout(8000) });
      if (res.ok && (res.headers.get("content-type") ?? "").startsWith("image/")) {
        upstream = res;
        break;
      }
    } catch {
      // Try the next gateway.
    }
  }
  if (!upstream) {
    return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
  }

  const type = upstream.headers.get("content-type") ?? "image/png";
  const length = Number(upstream.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  const body = await upstream.arrayBuffer();
  if (body.byteLength > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large" }, { status: 413 });
  }

  return new NextResponse(body, {
    headers: {
      "content-type": type,
      "cache-control": "public, max-age=86400, immutable",
    },
  });
}
