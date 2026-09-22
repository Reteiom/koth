import type { CSSProperties, ReactNode } from "react";
import { isDemoData } from "@/lib/data";
import { Icon, type IconName } from "./Icon";

export function Skeleton({
  width = "100%",
  height = 14,
  radius,
  style,
}: {
  width?: CSSProperties["width"];
  height?: CSSProperties["height"];
  radius?: number;
  style?: CSSProperties;
}) {
  return (
    <span
      className="skeleton"
      aria-hidden="true"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function EmptyState({
  title,
  children,
  icon = "inbox",
  action,
}: {
  title: string;
  children?: ReactNode;
  icon?: IconName;
  action?: ReactNode;
}) {
  return (
    <div className="state">
      <span className="icon-tile">
        <Icon name={icon} />
      </span>
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({
  title = "Data unavailable",
  error,
  onRetry,
}: {
  title?: string;
  error?: Error;
  onRetry?: () => void;
}) {
  return (
    <div className="state state-error" role="alert">
      <span className="icon-tile">
        <Icon name="alert" />
      </span>
      <h3>{title}</h3>
      <p>{error?.message ?? "Something went wrong while loading this data."}</p>
      {onRetry && (
        <button type="button" className="btn btn-ghost btn-sm" onClick={onRetry}>
          <Icon name="refresh" /> Try again
        </button>
      )}
    </div>
  );
}

/** Marks sections that currently render simulated data. */
export function DemoBadge() {
  if (!isDemoData) return null;
  return (
    <span
      className="badge badge-demo"
      title="Simulated data for preview. Live data appears once the launchpad backend is connected."
    >
      Demo data
    </span>
  );
}
