"use client";
/* eslint-disable @next/next/no-img-element -- local object-URL preview */

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { NETWORK_NAME, PROTOCOL_FEE_BPS } from "@/lib/config";
import {
  LAUNCH_ENABLED,
  LaunchNotAvailableError,
  LIMITS,
  launchToken,
  validateLaunch,
  type LaunchErrors,
} from "@/lib/launch";
import type { LaunchTokenInput, LaunchTokenResult } from "@/lib/types";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { Icon } from "@/components/ui/Icon";
import { TokenAvatar } from "@/components/ui/TokenAvatar";

type Phase =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; result: LaunchTokenResult }
  | { kind: "error"; message: string; unavailable?: boolean };

const EMPTY: LaunchTokenInput = {
  name: "",
  symbol: "",
  description: "",
  image: null,
  website: "",
  x: "",
  telegram: "",
};

export function LaunchForm() {
  const wallet = useWallet();
  const [input, setInput] = useState<LaunchTokenInput>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof LaunchTokenInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });

  const errors: LaunchErrors = useMemo(() => validateLaunch(input), [input]);
  const show = (k: keyof LaunchTokenInput) => (submitted || touched[k] ? errors[k] : undefined);

  const preview = useMemo(() => (input.image ? URL.createObjectURL(input.image) : null), [input.image]);
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  function set<K extends keyof LaunchTokenInput>(key: K, value: LaunchTokenInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    if (phase.kind === "error") setPhase({ kind: "idle" });
  }
  const blur = (k: keyof LaunchTokenInput) => () => setTouched((t) => ({ ...t, [k]: true }));

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    if (wallet.status === "unavailable") {
      setPhase({ kind: "error", message: "No wallet found. Install a browser wallet to launch." });
      return;
    }
    if (wallet.status !== "connected" || !wallet.provider) {
      await wallet.connect();
      return;
    }
    setPhase({ kind: "pending" });
    try {
      const result = await launchToken(
        { ...input, name: input.name.trim(), symbol: input.symbol.trim() },
        wallet.provider,
      );
      setPhase({ kind: "success", result });
    } catch (err) {
      if (err instanceof LaunchNotAvailableError) {
        setPhase({ kind: "error", message: err.message, unavailable: true });
      } else if ((err as { code?: number }).code === 4001) {
        setPhase({ kind: "error", message: "Transaction was rejected in your wallet." });
      } else {
        setPhase({ kind: "error", message: "Launch failed. Nothing was submitted — please try again." });
      }
    }
  }

  if (phase.kind === "success") {
    return (
      <div className="card card-pad launch-success">
        <span className="icon-tile">
          <Icon name="check" />
        </span>
        <h2>{input.name} is in the arena.</h2>
        <p className="lead">Your token is live and competing for the throne.</p>
        <div className="cta-row">
          <Link href={`/tokens/${phase.result.address}`} className="btn btn-primary">
            View token <Icon name="arrowRight" className="arrow" />
          </Link>
          <Link href="/leaderboard" className="btn btn-ghost">
            Leaderboard
          </Link>
        </div>
      </div>
    );
  }

  const connected = wallet.status === "connected";
  const pending = phase.kind === "pending";
  const submitLabel = pending
    ? "Confirm in your wallet…"
    : connected || wallet.status === "unavailable"
      ? "Launch token"
      : "Connect wallet to launch";

  return (
    <div className="launch">
      <form className="card card-pad launch-form" onSubmit={onSubmit} noValidate>
        {!LAUNCH_ENABLED && (
          <div className="notice" role="note">
            <Icon name="alert" />
            <span>
              Launch is in preview. The contract integration is being connected — submitting will
              not create a token yet.
            </span>
          </div>
        )}

        <fieldset disabled={pending}>
          <legend className="form-legend">Token</legend>
          <ImageField
            file={input.image}
            preview={preview}
            error={show("image")}
            onChange={(f) => {
              set("image", f);
              setTouched((t) => ({ ...t, image: true }));
            }}
          />
          <div className="form-row">
            <Field
              label="Name"
              value={input.name}
              onChange={(v) => set("name", v)}
              onBlur={blur("name")}
              error={show("name")}
              placeholder="e.g. Summit"
              maxLength={LIMITS.nameMax}
              required
            />
            <Field
              label="Ticker"
              value={input.symbol}
              onChange={(v) => set("symbol", v.toUpperCase().replace(/\s/g, ""))}
              onBlur={blur("symbol")}
              error={show("symbol")}
              placeholder="PEAK"
              maxLength={LIMITS.symbolMax}
              prefix="$"
              required
            />
          </div>
          <Field
            label="Description"
            value={input.description}
            onChange={(v) => set("description", v)}
            onBlur={blur("description")}
            error={show("description")}
            placeholder="What is this token about?"
            multiline
            hint={`${input.description.length}/${LIMITS.descriptionMax}`}
          />
        </fieldset>

        <fieldset disabled={pending}>
          <legend className="form-legend">
            Links <span className="muted">optional</span>
          </legend>
          <Field
            label="Website"
            value={input.website}
            onChange={(v) => set("website", v)}
            onBlur={blur("website")}
            error={show("website")}
            placeholder="https://"
            type="url"
          />
          <div className="form-row">
            <Field
              label="X"
              value={input.x}
              onChange={(v) => set("x", v)}
              onBlur={blur("x")}
              error={show("x")}
              placeholder="https://x.com/…"
              type="url"
            />
            <Field
              label="Telegram"
              value={input.telegram}
              onChange={(v) => set("telegram", v)}
              onBlur={blur("telegram")}
              error={show("telegram")}
              placeholder="https://t.me/…"
              type="url"
            />
          </div>
        </fieldset>

        {wallet.wrongNetwork && (
          <div className="notice notice-warn" role="alert">
            <Icon name="alert" />
            <span>
              Your wallet is on another network.{" "}
              <button type="button" className="text-btn" onClick={wallet.switchNetwork}>
                Switch to {NETWORK_NAME}
              </button>{" "}
              to launch.
            </span>
          </div>
        )}

        {phase.kind === "error" && (
          <div className={phase.unavailable ? "notice" : "inline-error"} role="alert">
            <Icon name="alert" />
            <span>{phase.message}</span>
          </div>
        )}

        {submitted && Object.keys(errors).length > 0 && (
          <p className="form-summary" role="alert">
            Fix the highlighted fields to continue.
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg launch-submit"
          disabled={pending || wallet.status === "connecting" || wallet.wrongNetwork}
        >
          {pending ? <span className="spinner" aria-hidden="true" /> : <Icon name="rocket" />}
          {submitLabel}
        </button>
        <p className="form-foot muted">
          Trading on the platform carries a {PROTOCOL_FEE_BPS / 100}% protocol fee that funds the
          buyback &amp; burn reward.
        </p>
      </form>

      <aside className="launch-aside">
        <div className="card card-pad launch-preview">
          <span className="stat-label">Arena preview</span>
          <div className="launch-preview-row">
            {preview ? (
              <span className="avatar" style={{ width: 56, height: 56 }}>
                <img src={preview} alt="" />
              </span>
            ) : (
              <TokenAvatar
                symbol={input.symbol || "??"}
                address={input.symbol || "preview"}
                logoUrl={null}
                size={56}
              />
            )}
            <div>
              <h3>{input.name || "Your token"}</h3>
              <span className="mono muted">${input.symbol || "TICKER"}</span>
            </div>
          </div>
          <p className="muted">{input.description || "Your description appears here."}</p>
        </div>

        <div className="card card-pad launch-rules">
          <span className="stat-label">What happens next</span>
          <ol>
            <li>
              <Icon name="swords" /> Your token enters the arena and is ranked by market cap.
            </li>
            <li>
              <Icon name="clock" /> Rounds last one hour. Take #1 to hold the Peak.
            </li>
            <li>
              <Icon name="flame" /> Win a round and platform fees buy back and burn your token.
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder,
  multiline,
  hint,
  maxLength,
  prefix,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  hint?: string;
  maxLength?: number;
  prefix?: string;
  type?: string;
  required?: boolean;
}) {
  const id = useId();
  const errId = `${id}-err`;
  const common = {
    id,
    value,
    placeholder,
    maxLength,
    onBlur,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": error ? errId : undefined,
    required,
  };
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <label htmlFor={id}>
        {label}
        {hint && <span className="field-hint num">{hint}</span>}
      </label>
      <div className="field-control">
        {prefix && <span className="field-prefix">{prefix}</span>}
        {multiline ? (
          <textarea {...common} rows={3} onChange={(e) => onChange(e.target.value)} />
        ) : (
          <input {...common} type={type} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
        )}
      </div>
      {error && (
        <span className="field-error" id={errId}>
          {error}
        </span>
      )}
    </div>
  );
}

function ImageField({
  file,
  preview,
  error,
  onChange,
}: {
  file: File | null;
  preview: string | null;
  error?: string;
  onChange: (f: File | null) => void;
}) {
  const id = useId();
  const [drag, setDrag] = useState(false);
  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <span className="field-label">Image</span>
      <label
        htmlFor={id}
        className={`dropzone${drag ? " is-drag" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          onChange(e.dataTransfer.files[0] ?? null);
        }}
      >
        {preview ? (
          <img src={preview} alt="Token image preview" className="dropzone-img" />
        ) : (
          <span className="icon-tile">
            <Icon name="upload" />
          </span>
        )}
        <span className="dropzone-text">
          <strong>{file ? file.name : "Upload token image"}</strong>
          <span className="muted">PNG, JPG, WEBP or GIF · up to 2 MB · square works best</span>
        </span>
        <input
          id={id}
          type="file"
          accept={LIMITS.imageTypes.join(",")}
          className="sr-only"
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
      </label>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}
