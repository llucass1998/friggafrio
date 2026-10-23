import type { MetaInstagramMediaItem, NormalizedInstagramPost } from "./types"

const INSTAGRAM_PERMALINK_REGEX =
  /^https:\/\/(?:www\.)?instagram\.com\/(?:(?:p|reel|tv)\/[A-Za-z0-9_-]+|[A-Za-z0-9_.-]+)\/?$/i

/**
 * Sanitizes captions by removing HTML markup, scripts, and control characters.
 * Preserves normal text, punctuation, emojis, and hashtags.
 */
export function sanitizeCaption(rawCaption?: string | null): string {
  if (!rawCaption) return ""
  return rawCaption
    .replace(/<[^>]*>/g, "") // Strip HTML tags
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "") // Strip non-printable control chars
    .trim()
}

/**
 * Validates whether an Instagram permalink belongs to the official Instagram domain.
 */
export function isValidInstagramPermalink(permalink?: string | null): boolean {
  if (!permalink) return false
  return INSTAGRAM_PERMALINK_REGEX.test(permalink.trim())
}

/**
 * Validates an HTTP(S) or local relative media URL.
 */
export function isValidMediaUrl(url?: string | null): boolean {
  if (!url) return false
  if (url.startsWith("/")) return true
  try {
    const parsed = new URL(url)
    return parsed.protocol === "https:" || parsed.protocol === "http:"
  } catch {
    return false
  }
}

/**
 * Normalizes a raw media item from the official Meta Instagram Graph API.
 * Returns null if the item lacks essential fields or has invalid security attributes.
 */
export function normalizeMetaMediaItem(
  item: MetaInstagramMediaItem,
  existingHidden = false
): NormalizedInstagramPost | null {
  if (!item || !item.id || typeof item.id !== "string") {
    return null
  }

  const id = item.id.trim()
  if (!id) return null

  // Ensure permalink is secure and official
  const permalink = item.permalink?.trim()
  if (!isValidInstagramPermalink(permalink)) {
    return null
  }

  // Determine media URL
  const rawMediaUrl = item.media_url?.trim()
  const rawThumbnailUrl = item.thumbnail_url?.trim()

  let mediaUrl = ""
  let thumbnailUrl: string | null = null

  if (item.media_type === "VIDEO") {
    // For video, thumbnail_url is required for static image display on web
    if (isValidMediaUrl(rawThumbnailUrl)) {
      thumbnailUrl = rawThumbnailUrl!
      mediaUrl = rawThumbnailUrl!
    } else if (isValidMediaUrl(rawMediaUrl)) {
      mediaUrl = rawMediaUrl!
    } else {
      return null
    }
  } else {
    // IMAGE or CAROUSEL_ALBUM
    if (!isValidMediaUrl(rawMediaUrl)) {
      return null
    }
    mediaUrl = rawMediaUrl!
    if (isValidMediaUrl(rawThumbnailUrl)) {
      thumbnailUrl = rawThumbnailUrl!
    }
  }

  // Parse ISO timestamp
  let timestampIso: string | null = null
  if (item.timestamp) {
    const parsedDate = new Date(item.timestamp)
    if (!Number.isNaN(parsedDate.getTime())) {
      timestampIso = parsedDate.toISOString()
    }
  }

  return {
    id: `ig_${id}`,
    instagram_id: id,
    caption: sanitizeCaption(item.caption),
    media_type: item.media_type,
    media_url: mediaUrl,
    thumbnail_url: thumbnailUrl,
    permalink: permalink!,
    timestamp: timestampIso,
    is_hidden: existingHidden,
  }
}
