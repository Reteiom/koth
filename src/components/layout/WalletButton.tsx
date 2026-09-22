"use client";

import { useEffect, useRef, useState } from "react";
import { NETWORK_NAME } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { Icon } from "@/components/ui/Icon";

export function WalletButton({ block = false }: { block?: boolean }) {
  const w = useWallet();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const cls = `btn btn-sm ${block ? "wallet-block " : ""}`;

  if (w.status === "connected" && w.address) {
    return (
      <div className="wallet" ref={ref}>
        <button
          type="button"
          className={`${cls}btn-ghost wallet-connected${w.wrongNetwork ? " is-wrong" : ""}`}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className="wallet-dot" />
          <span className="num">{shortAddress(w.address, 6, 4)}</span>
        </button>
        {open && (
          <div className="wallet-menu card" role="menu">
            {w.wrongNetwork && (
              <>
                <p className="wallet-warn">Your wallet is on another network.</p>
                <button
                  type="button"
                  role="menuitem"
                  className="wallet-switch"
                  onClick={() => {
                    w.switchNetwork();
                    setOpen(false);
                  }}
                >
                  <Icon name="refresh" /> Switch to {NETWORK_NAME}
                </button>
              </>
            )}
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                navigator.clipboard?.writeText(w.address!).catch(() => {});
                setOpen(false);
              }}
            >
              <Icon name="copy" /> Copy address
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                w.disconnect();
                setOpen(false);
              }}
            >
              <Icon name="close" /> Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="wallet">
      <button
        type="button"
        className={`${cls}btn-primary`}
        onClick={w.connect}
        disabled={w.status === "connecting"}
        title={w.status === "unavailable" ? "No browser wallet detected" : undefined}
      >
        <Icon name="wallet" />
        {w.status === "connecting" ? "Connecting…" : "Connect Wallet"}
      </button>
      {w.error && (
        <p className="wallet-error" role="alert">
          {w.error}
        </p>
      )}
    </div>
  );
}
