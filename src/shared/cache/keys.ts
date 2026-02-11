export type CursorCacheSegmentValue =
  | string
  | number
  | boolean
  | null
  | undefined;
export type CursorCacheSegment = [string, CursorCacheSegmentValue];

const normalizeSegmentValue = (value: CursorCacheSegmentValue): string => {
  if (value === undefined || value === null) return "_";
  if (typeof value === "boolean") return value ? "1" : "0";
  if (typeof value === "number") {
    if (Number.isNaN(value) || !Number.isFinite(value)) return "_";
    return String(value);
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : "_";
};

export const cursorCacheNamespace = (
  feature: string,
  version?: number | string,
): string => {
  const slug = feature.trim().replace(/\s+/g, "-");
  if (version === undefined || version === null || version === "") {
    return `cursor:${slug}`;
  }
  const versionStr = String(version).replace(/^v/i, "");
  return `cursor:${slug}:v${versionStr}`;
};

export const buildCursorCacheKey = ({
  feature,
  version = 1,
  userId,
  segments = [],
}: {
  feature: string;
  version?: number | string;
  userId?: string | null;
  segments?: CursorCacheSegment[];
}): string => {
  const safeUser = normalizeSegmentValue(userId ?? "_");
  const parts = [cursorCacheNamespace(feature, version), safeUser];

  for (const [label, value] of segments) {
    parts.push(`${label}:${normalizeSegmentValue(value)}`);
  }

  return parts.join(":");
};
