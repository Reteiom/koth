import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
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

/**
 * Vercel names the token after the store it belongs to (BLOB_READ_WRITE_TOKEN,
 * but also e.g. PEAK_READ_WRITE_TOKEN), so any of them is accepted.
 */
function blobToken(): string | undefined {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;
  for (const [name, value] of Object.entries(process.env)) {
    if (!value) continue;
    if (name.endsWith("_READ_WRITE_TOKEN") || value.startsWith("vercel_blob_rw_")) return value;
  }
  return undefined;
}

function provider(): "pinata" | "blob" | null {
  if (process.env.PINATA_JWT) return "pinata";
  if (blobToken()) return "blob";
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

async function putInBlob(file: File): Promise<string> {
  const blob = await put(`tokens/${file.name}`, file, {
    access: "public",
    addRandomSuffix: true,
    contentType: file.type,
    token: blobToken(),
  });
  return blob.url;
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
    const url = target === "pinata" ? await pinToIpfs(file) : await putInBlob(file);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });
  }
}
