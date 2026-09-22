import { DATA_SOURCE } from "@/lib/config";
import { apiSource } from "./apiSource";
import { mockSource } from "./mock/mockSource";
import type { LaunchpadDataSource } from "./source";

/** The active data source. Switch with NEXT_PUBLIC_DATA_SOURCE=api. */
export const launchpad: LaunchpadDataSource = DATA_SOURCE === "api" ? apiSource : mockSource;

export const isDemoData = launchpad.kind === "mock";

export type { LaunchpadDataSource } from "./source";
