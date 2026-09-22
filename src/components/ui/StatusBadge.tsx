import type { TokenStatus } from "@/lib/types";
import { Icon } from "./Icon";

const LABEL: Record<TokenStatus, string> = {
  king: "King",
  challenger: "Challenger",
  rising: "Rising",
  idle: "In arena",
};

export function StatusBadge({ status }: { status: TokenStatus }) {
  return (
    <span className={`badge badge-${status}`}>
      {status === "king" && <Icon name="crown" />}
      {status === "rising" && <Icon name="trendUp" />}
      {LABEL[status]}
    </span>
  );
}
