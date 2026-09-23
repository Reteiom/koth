import { get } from "@vercel/blob";
import { NextResponse } from "next/server";
import { blobAuth, PRIVATE_IMAGE_PREFIX } from "@/lib/blob";

/**
 * Serves token images kept in a private Blob store.
 *
 * Only files under tokens/ are reachable — nothing else in the store is
 * exposed. Images never change once uploaded (their names carry a random
 * suffix), so they are cached aggressively.
 */
export async function GET(_request: Request, ctx: RouteContext<"/api/blob/[...path]">) {
  const { path } = await ctx.params;
  const pathname = path.map(decodeURIComponent).join("/");

  if (!pathname.startsWith(PRIVATE_IMAGE_PREFIX) || pathname.includes("..")) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const result = await get(pathname, { access: "private", ...blobAuth() });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (!result.blob.contentType?.startsWith("image/")) {
      return NextResponse.json({ error: "Not an image" }, { status: 415 });
    }
    return new NextResponse(result.stream, {
      headers: {
        "content-type": result.blob.contentType,
        "cache-control": "public, max-age=31536000, immutable",
        "access-control-allow-origin": "*",
      },
    });
  } catch {
    return NextResponse.json({ error: "Image unavailable" }, { status: 502 });
  }
}
