import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { blobAuth, blobStoreId, blobToken, PRIVATE_IMAGE_PREFIX } from "@/lib/blob";
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "@/lib/upload";

/**
 * Hosts a token image so its address can be stored on-chain.
 *
 * Two ways to enable it, whichever is easier — set one environment variable:
 *
 *   PINATA_JWT              → pins to IPFS, stores ipfs://<cid> (preferred:
 *                             permanent and the same form other tokens use)
 *   BLOB_READ_WRITE_TOKEN   → Vercel Blob, added automatically when a Blob
 *                             store is created in the project
 *
 * With neither set, uploads report 503 and the launch form asks for a link.
 */

function provider(): "pinata" | "blob" | "blob-oidc" | null {
  if (process.env.PINATA_JWT) return "pinata";
  if (blobToken()) return "blob";
  if (blobStoreId()) return "blob-oidc";
  return null;
}

/** Lets the launch form know whether file uploads are available. */
export async function GET() {
  return NextResponse.json({ configured: provider() !== null, provider: provider() });
}

async function pinToIpfs(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file, file.name);
  body.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { authorization: `Bearer ${process.env.PINATA_JWT}` },
    body,
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) {
    throw new Error(`Pinata responded with ${res.status}`);
  }
  const data = (await res.json()) as { IpfsHash?: string };
  if (!data.IpfsHash) throw new Error("Pinata returned no CID");
  return `ipfs://${data.IpfsHash}`;
}

/**
 * Stores the image in Blob. Public stores hand back a public URL. Private
 * stores cannot serve files to strangers, so the image is served through
 * /api/blob on this site and that address is what goes on-chain.
 */
/** Learned on the first upload, so later ones skip the failing public attempt. */
let storeIsPrivate = false;

async function putInBlob(file: File, origin: string): Promise<string> {
  const common = {
    addRandomSuffix: true,
    contentType: file.type,
    ...blobAuth(),
  } as const;
  const pathname = `${PRIVATE_IMAGE_PREFIX}${file.name}`;

  if (!storeIsPrivate) {
    try {
      const blob = await put(pathname, file, { ...common, access: "public" });
      return blob.url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (!/private/i.test(message)) throw error;
      storeIsPrivate = true;
    }
  }

  const blob = await put(pathname, file, { ...common, access: "private" });
  return `${origin}/api/blob/${blob.pathname.split("/").map(encodeURIComponent).join("/")}`;
}

/** The address images are served from — the production domain when known. */
function siteOrigin(request: Request): string {
  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return production ? `https://${production}` : new URL(request.url).origin;
}

export async function POST(request: Request) {
  const target = provider();
  if (!target) {
    return NextResponse.json(
      { error: "Image hosting is not configured yet. Paste an image link instead." },
      { status: 503 },
    );
  }

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file received." }, { status: 400 });
  }
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) {
    return NextResponse.json({ error: "PNG, JPG, WEBP or GIF only." }, { status: 415 });
  }
  if (file.size > IMAGE_MAX_BYTES) {
    return NextResponse.json({ error: "Max file size is 2 MB." }, { status: 413 });
  }

  try {
    const url =
      target === "pinata" ? await pinToIpfs(file) : await putInBlob(file, siteOrigin(request));
    return NextResponse.json({ url });
  } catch (error) {
    // Storage SDK messages name the missing setting, never a credential.
    const detail = error instanceof Error ? error.message.split("\n")[0].slice(0, 200) : undefined;
    console.error("[upload] failed via", target, detail);
    return NextResponse.json({ error: "Upload failed. Try again.", detail }, { status: 502 });
  }
}
