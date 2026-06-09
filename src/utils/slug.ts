const SAFE_SEGMENT_FALLBACK = "general";

export function slugify(value: string, fallback = SAFE_SEGMENT_FALLBACK): string {
  const slug = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

  return slug || fallback;
}

export function safeSegment(value: string, fallback = SAFE_SEGMENT_FALLBACK): string {
  const segment = slugify(value, fallback);

  if (segment.includes("..") || segment.includes("/") || segment.includes("\\")) {
    return fallback;
  }

  return segment;
}

