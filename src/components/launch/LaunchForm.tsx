"use client";
/* eslint-disable @next/next/no-img-element -- token art is hosted on arbitrary hosts */

import Link from "next/link";
import { useEffect, useId, useMemo, useState } from "react";
import { formatEther } from "viem";
import {
  explorerTxUrl,
  feePct,
  NETWORK_NAME,
  PLATFORM_FEE_BPS,
  PLATFORM_FEE_SHARE_PCT,
  TRADING_FEE_BPS,
  tradeUrl,
} from "@/lib/config";
import { imageUrl } from "@/lib/ipfs";
import {
  getLaunchInfo,
  LaunchPausedError,
  LaunchRejectedError,
  LIMITS,
  launchToken,
  validateLaunch,
  type LaunchErrors,
} from "@/lib/launch";
import type { LaunchTokenInput, LaunchTokenResult } from "@/lib/types";
import { IMAGE_TYPES, UploadUnavailableError, uploadTokenImage, validateImageFile } from "@/lib/upload";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/States";
import { TokenAvatar } from "@/components/ui/TokenAvatar";

type Phase =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "pending" }
  | { kind: "success"; result: LaunchTokenResult }
  | { kind: "error"; message: string; soft?: boolean };

type ImageMode = "file" | "link";

const EMPTY: LaunchTokenInput = {
  name: "",
  symbol: "",
  description: "",
  image: "",
  website: "",
  x: "",
  telegram: "",
  initialBuyEth: "",
};

export function LaunchForm() {
  const wallet = useWallet();
  const [input, setInput] = useState<LaunchTokenInput>(EMPTY);
  const [imageMode, setImageMode] = useState<ImageMode>("file");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [touched, setTouched] = useState<Partial<Record<keyof LaunchTokenInput, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [info, setInfo] = useState<{ enabled: boolean; feeWei: bigint } | null>(null);
  const [infoError, setInfoError] = useState(false);

  useEffect(() => {
    let active = true;
    getLaunchInfo().then(
      (v) => active && setInfo(v),
      () => active && setInfoError(true),
    );
    return () => {
      active = false;
    };
  }, []);

  // Validate against a stand-in URL while an uploaded file stands in for the link.
  const errors: LaunchErrors = useMemo(
    () => validateLaunch(imageMode === "file" ? { ...input, image: "file://selected" } : input),
    [input, imageMode],
  );
  const imageError =
    imageMode === "file"
      ? imageFile
        ? validateImageFile(imageFile)
        : "Upload a token image."
      : errors.image;
  const invalid = Object.keys(errors).length > 0 || Boolean(imageError);

  const show = (k: keyof LaunchTokenInput) => (submitted || touched[k] ? errors[k] : undefined);
  const showImageError = submitted || touched.image ? imageError : undefined;

  const filePreview = useMemo(
    () => (imageFile ? URL.createObjectURL(imageFile) : null),
    [imageFile],
  );
  useEffect(() => () => void (filePreview && URL.revokeObjectURL(filePreview)), [filePreview]);
  const preview = imageMode === "file" ? filePreview : imageUrl(input.image);

  function set<K extends keyof LaunchTokenInput>(key: K, value: LaunchTokenInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
    if (phase.kind === "error") setPhase({ kind: "idle" });
  }
  const blur = (k: keyof LaunchTokenInput) => () => setTouched((t) => ({ ...t, [k]: true }));

  function pickFile(file: File | null) {
    setImageFile(file);
    setTouched((t) => ({ ...t, image: true }));
    if (phase.kind === "error") setPhase({ kind: "idle" });
  }

  function switchMode(mode: ImageMode) {
    setImageMode(mode);
    setTouched((t) => ({ ...t, image: false }));
    if (phase.kind === "error") setPhase({ kind: "idle" });
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (invalid) return;
    if (wallet.status === "unavailable") {
      setPhase({ kind: "error", message: "No wallet found. Install a browser wallet to launch." });
      return;
    }
    if (wallet.status !== "connected" || !wallet.provider) {
      await wallet.connect();
      return;
    }

    let imageRef = input.image.trim();
    if (imageMode === "file" && imageFile) {
      setPhase({ kind: "uploading" });
      try {
        imageRef = await uploadTokenImage(imageFile);
      } catch (err) {
        if (err instanceof UploadUnavailableError) {
          setImageMode("link");
          setPhase({ kind: "error", message: err.message, soft: true });
        } else {
          setPhase({ kind: "error", message: err instanceof Error ? err.message : "Upload failed." });
        }
        return;
      }
    }

    setPhase({ kind: "pending" });
    try {
      const result = await launchToken({ ...input, image: imageRef }, wallet.provider);
      setPhase({ kind: "success", result });
    } catch (err) {
      if (err instanceof LaunchRejectedError) {
        setPhase({ kind: "error", message: err.message });
      } else if (err instanceof LaunchPausedError) {
        setPhase({ kind: "error", message: err.message, soft: true });
      } else {
        const detail = err instanceof Error ? err.message.split("\n")[0] : "";
        setPhase({ kind: "error", message: detail || "Launch failed. Nothing was submitted." });
      }
    }
  }

  if (phase.kind === "success") {
    const tx = explorerTxUrl(phase.result.txHash);
    const trade = tradeUrl(phase.result.address);
    return (
      <div className="card card-pad launch-success">
        <span className="icon-tile">
          <Icon name="check" />
        </span>
        <h2>{input.name} is live.</h2>
        <p className="lead">
          Your token is on {NETWORK_NAME} and competing for the Peak from its first trade.
        </p>
        <div className="cta-row">
          <Link href={`/tokens/${phase.result.address}`} className="btn btn-primary">
            View token <Icon name="arrowRight" className="arrow" />
          </Link>
          {trade && (
            <a href={trade} target="_blank" rel="noreferrer" className="btn btn-ghost">
              Trade <Icon name="arrowUpRight" />
            </a>
          )}
          {tx && (
            <a href={tx} target="_blank" rel="noreferrer" className="btn btn-ghost">
              Transaction <Icon name="arrowUpRight" />
            </a>
          )}
        </div>
      </div>
    );
  }

  const connected = wallet.status === "connected";
  const uploading = phase.kind === "uploading";
  const pending = phase.kind === "pending";
  const busy = uploading || pending;
  const paused = info !== null && !info.enabled;
  const submitLabel = uploading
    ? "Uploading image…"
    : pending
      ? "Confirm in your wallet…"
      : paused
        ? "Launches paused"
        : connected || wallet.status === "unavailable"
          ? "Launch token"
          : "Connect wallet to launch";

  return (
    <div className="launch">
      <form className="card card-pad launch-form" onSubmit={onSubmit} noValidate>
        {paused && (
          <div className="notice notice-warn" role="note">
            <Icon name="alert" />
            <span>
              The launchpad contract has launches turned off right now. You can prepare your token
              here, but the transaction will not go through until they are re-enabled.
            </span>
          </div>
        )}
        {infoError && (
          <div className="notice notice-warn" role="note">
            <Icon name="alert" />
            <span>
              Could not reach {NETWORK_NAME} to read the launch fee. Check your connection.
            </span>
          </div>
        )}

        <fieldset disabled={busy}>
          <legend className="form-legend">Token</legend>
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

          <ImageField
            mode={imageMode}
            onModeChange={switchMode}
            file={imageFile}
            preview={preview}
            link={input.image}
            onFile={pickFile}
            onLink={(v) => set("image", v)}
            onLinkBlur={blur("image")}
            error={showImageError}
          />

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

        <fieldset disabled={busy}>
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

        <fieldset disabled={busy}>
          <legend className="form-legend">
            First buy <span className="muted">optional</span>
          </legend>
          <Field
            label="Buy at launch"
            value={input.initialBuyEth}
            onChange={(v) => set("initialBuyEth", v.replace(",", "."))}
            onBlur={blur("initialBuyEth")}
            error={show("initialBuyEth")}
            placeholder="0.0"
            suffix="ETH"
            hint="Sent with the launch transaction"
          />
        </fieldset>

        <div className="notice" role="note">
          <Icon name="vault" />
          <span>
            Your token&apos;s share of trading fees ({PLATFORM_FEE_SHARE_PCT}% of the{" "}
            {feePct(TRADING_FEE_BPS)}% fee, so {feePct(PLATFORM_FEE_BPS)}% of volume) goes to the
            platform vault, not to you. That is what funds the hourly buyback &amp; burn — including
            of your token, if it wins.
          </span>
        </div>

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
          <div className={phase.soft ? "notice notice-warn" : "inline-error"} role="alert">
            <Icon name="alert" />
            <span>{phase.message}</span>
          </div>
        )}

        {submitted && invalid && (
          <p className="form-summary" role="alert">
            Fix the highlighted fields to continue.
          </p>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-lg launch-submit"
          disabled={busy || paused || wallet.status === "connecting" || wallet.wrongNetwork}
        >
          {busy ? <span className="spinner" aria-hidden="true" /> : <Icon name="rocket" />}
          {submitLabel}
        </button>

        <p className="form-foot muted">
          {info && <>Launch fee {formatEther(info.feeWei)} ETH plus gas. </>}
          {!info && !infoError && <Skeleton width={150} height={12} />}
          Trades on your token carry a {feePct(TRADING_FEE_BPS)}% fee.
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
            <li>
              <Icon name="vault" /> Trading fees on your token fund that vault — they do not go to
              you.
            </li>
          </ol>
        </div>
      </aside>
    </div>
  );
}

function ImageField({
  mode,
  onModeChange,
  file,
  preview,
  link,
  onFile,
  onLink,
  onLinkBlur,
  error,
}: {
  mode: ImageMode;
  onModeChange: (mode: ImageMode) => void;
  file: File | null;
  preview: string | null;
  link: string;
  onFile: (file: File | null) => void;
  onLink: (value: string) => void;
  onLinkBlur: () => void;
  error?: string;
}) {
  const id = useId();
  const [drag, setDrag] = useState(false);

  return (
    <div className={`field${error ? " has-error" : ""}`}>
      <span className="field-label">
        Image
        <button
          type="button"
          className="text-btn field-hint"
          onClick={() => onModeChange(mode === "file" ? "link" : "file")}
        >
          {mode === "file" ? "Use a link instead" : "Upload a file instead"}
        </button>
      </span>

      {mode === "file" ? (
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
            onFile(e.dataTransfer.files[0] ?? null);
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
            accept={IMAGE_TYPES.join(",")}
            className="sr-only"
            onChange={(e) => onFile(e.target.files?.[0] ?? null)}
          />
        </label>
      ) : (
        <div className="field-control">
          <input
            type="text"
            value={link}
            placeholder="https://… or ipfs://…"
            onChange={(e) => onLink(e.target.value)}
            onBlur={onLinkBlur}
            autoComplete="off"
            aria-label="Image link"
          />
        </div>
      )}
      {error ? (
        <span className="field-error">{error}</span>
      ) : (
        <span className="field-note muted">The image link is stored on-chain with your token.</span>
      )}
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
  suffix,
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
  suffix?: string;
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
          <input
            {...common}
            type={type}
            onChange={(e) => onChange(e.target.value)}
            autoComplete="off"
          />
        )}
        {suffix && <span className="field-suffix">{suffix}</span>}
      </div>
      {error && (
        <span className="field-error" id={errId}>
          {error}
        </span>
      )}
    </div>
  );
}
