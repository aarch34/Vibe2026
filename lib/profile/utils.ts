/**
 * Profile utilities and sanitizers
 */

/**
 * Sanitizes Instagram handle into pure username (strips leading @, full URL paths, query parameters)
 */
export function cleanInstagramUsername(val?: string | null): string | null {
  if (!val) return null;
  let cleaned = val.trim();
  if (!cleaned) return null;

  // If full URL provided, extract pathname
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "");
  // Remove query string or trailing slashes
  cleaned = cleaned.split("/")[0].split("?")[0];
  // Remove leading @
  cleaned = cleaned.replace(/^@+/, "").trim();
  return cleaned || null;
}

/**
 * Parses comma-separated string or array into string array
 */
export function parseStringArray(val?: string[] | string | null): string[] {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val.map((s) => String(s).trim()).filter(Boolean);
  }
  return String(val)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
