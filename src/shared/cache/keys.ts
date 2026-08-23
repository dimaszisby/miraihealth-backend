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

/**
 * Builds a cursor-pagination cache key.
 *
 * `organizationId` is a required property, not an optional `segments` entry, so a
 * caller cannot silently omit the tenant boundary — see ADR-0035. It is emitted as
 * a fixed `org:<id>` segment directly after the user segment.
 */
export const buildCursorCacheKey = ({
  feature,
  version = 1,
  userId,
  organizationId,
  segments = [],
}: {
  feature: string;
  version?: number | string;
  userId?: string | null;
  organizationId: string | null | undefined;
  segments?: CursorCacheSegment[];
}): string => {
  const safeUser = normalizeSegmentValue(userId ?? "_");
  const safeOrg = normalizeSegmentValue(organizationId ?? "_");
  const parts = [
    cursorCacheNamespace(feature, version),
    safeUser,
    `org:${safeOrg}`,
  ];

  for (const [label, value] of segments) {
    parts.push(`${label}:${normalizeSegmentValue(value)}`);
  }

  return parts.join(":");
};
