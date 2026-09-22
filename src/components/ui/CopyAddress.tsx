"use client";

import { useState } from "react";
import { explorerAddressUrl } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { Icon } from "./Icon";

export function CopyAddress({ address, label }: { address: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const explorer = explorerAddressUrl(address);

  async function copy() {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard blocked — the full address is still in the title */
    }
  }

  return (
    <span className="copy" title={address}>
      <span className="num">{shortAddress(address)}</span>
      <button type="button" onClick={copy} aria-label={copied ? "Copied" : `Copy ${label ?? "address"}`}>
        <Icon name={copied ? "check" : "copy"} />
      </button>
      {explorer && (
        <a href={explorer} target="_blank" rel="noreferrer" aria-label="View on explorer">
          <Icon name="external" />
        </a>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Address copied" : ""}
      </span>
    </span>
  );
}
