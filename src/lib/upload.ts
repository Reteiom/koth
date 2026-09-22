/** Token image upload: the file is hosted, and its URL is what goes on-chain. */

export const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const;
export const IMAGE_MAX_BYTES = 2 * 1024 * 1024;

export class UploadUnavailableError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadUnavailableError";
  }
}

/** Client-side checks so obvious problems never reach the network. */
export function validateImageFile(file: File): string | undefined {
  if (!(IMAGE_TYPES as readonly string[]).includes(file.type)) return "PNG, JPG, WEBP or GIF only.";
  if (file.size > IMAGE_MAX_BYTES) return "Max file size is 2 MB.";
  return undefined;
}

/** Uploads the image and returns its public URL. */
export async function uploadTokenImage(file: File): Promise<string> {
  const body = new FormData();
  body.append("file", file);

  let res: Response;
  try {
    res = await fetch("/api/upload", { method: "POST", body });
  } catch {
    throw new Error("Could not reach the upload service.");
  }

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (res.status === 503) throw new UploadUnavailableError(data.error ?? "Image hosting is not configured.");
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed. Try again.");
  return data.url;
}
