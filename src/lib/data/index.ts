import { API_URL } from "@/lib/config";
import { apiSource } from "./apiSource";
import { emptySource } from "./emptySource";
import type { LaunchpadDataSource } from "./source";

/**
 * The active data source: the launchpad API when it is configured, otherwise a
 * source that reports no data yet.
 */
export const launchpad: LaunchpadDataSource = API_URL ? apiSource : emptySource;

/** True when no backend is configured, so every section renders empty states. */
export const isBackendConfigured = launchpad.kind === "api";

export type { LaunchpadDataSource } from "./source";
