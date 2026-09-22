/**
 * Token launch integration point.
 *
 * The launch itself happens through the underlying launchpad contracts, which
 * are not wired into this frontend yet. `launchToken` is the single place to
 * connect them: build the transaction from `input`, send it through the
 * connected wallet (`provider`), wait for the receipt and return the new
 * token address.
 */
import type { Eip1193Provider } from "@/lib/wallet/eip1193";
import type { LaunchTokenInput, LaunchTokenResult } from "@/lib/types";

export class LaunchNotAvailableError extends Error {
  constructor() {
    super("Token launch is not connected yet. The launch contract integration is pending.");
    this.name = "LaunchNotAvailableError";
  }
}

export const LAUNCH_ENABLED = process.env.NEXT_PUBLIC_LAUNCH_ENABLED === "true";

export const LIMITS = {
  nameMax: 32,
  symbolMin: 2,
  symbolMax: 10,
  descriptionMax: 280,
  imageMaxBytes: 2 * 1024 * 1024,
  imageTypes: ["image/png", "image/jpeg", "image/webp", "image/gif"],
} as const;

export type LaunchErrors = Partial<Record<keyof LaunchTokenInput, string>>;

function isUrl(value: string) {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export function validateLaunch(input: LaunchTokenInput): LaunchErrors {
  const errors: LaunchErrors = {};
  const name = input.name.trim();
  const symbol = input.symbol.trim();

  if (!name) errors.name = "Name is required.";
  else if (name.length > LIMITS.nameMax) errors.name = `Keep it under ${LIMITS.nameMax} characters.`;

  if (!symbol) errors.symbol = "Ticker is required.";
  else if (!/^[A-Z0-9]+$/.test(symbol)) errors.symbol = "Use letters A–Z and digits only.";
  else if (symbol.length < LIMITS.symbolMin || symbol.length > LIMITS.symbolMax)
    errors.symbol = `${LIMITS.symbolMin}–${LIMITS.symbolMax} characters.`;

  if (input.description.length > LIMITS.descriptionMax)
    errors.description = `Keep it under ${LIMITS.descriptionMax} characters.`;

  if (!input.image) errors.image = "Upload a token image.";
  else if (!(LIMITS.imageTypes as readonly string[]).includes(input.image.type))
    errors.image = "PNG, JPG, WEBP or GIF only.";
  else if (input.image.size > LIMITS.imageMaxBytes) errors.image = "Max file size is 2 MB.";

  if (input.website && !isUrl(input.website)) errors.website = "Enter a full URL (https://…).";
  if (input.x && !isUrl(input.x)) errors.x = "Enter a full URL (https://x.com/…).";
  if (input.telegram && !isUrl(input.telegram)) errors.telegram = "Enter a full URL (https://t.me/…).";

  return errors;
}

export async function launchToken(
  input: LaunchTokenInput,
  provider: Eip1193Provider,
): Promise<LaunchTokenResult> {
  void input;
  void provider;
  // Integration point: replace with the launch contract call.
  throw new LaunchNotAvailableError();
}
