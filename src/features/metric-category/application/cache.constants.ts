import { cursorCacheNamespace } from "@/shared/cache/keys.js";

export const METRIC_CATEGORY_CURSOR_FEATURE = "metric-categories.js";
export const METRIC_CATEGORY_CURSOR_VERSION = 1;

export const METRIC_CATEGORY_CURSOR_NAMESPACE_ALL = cursorCacheNamespace(
  METRIC_CATEGORY_CURSOR_FEATURE,
  "*",
);
