import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { IMAGE_MAX_BYTES, IMAGE_TYPES } from "@/lib/upload";

/**
 * Hosts a token image so its public URL can be stored on-chain.
 *
 * Backed by Vercel Blob: create a Blob store in the Vercel project and the
 * BLOB_READ_WRITE_TOKEN variable is added automatically.
 */
export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
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
    const blob = await put(`tokens/${file.name}`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: file.type,
    });
    return NextResponse.json({ url: blob.url });
  } catch {
    return NextResponse.json({ error: "Upload failed. Try again." }, { status: 502 });
  }
}
