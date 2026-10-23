import {
  sanitizeCaption,
  isValidInstagramPermalink,
  isValidMediaUrl,
  normalizeMetaMediaItem,
} from "./normalizer"
import { InstagramApiClient } from "./client"
import type { MetaInstagramMediaItem } from "./types"

describe("Instagram Integration - Normalizer & Security", () => {
  describe("sanitizeCaption", () => {
    it("strips HTML tags and malicious script payloads", () => {
      const malicious = 'Confira nosso novo estoque! <script>alert("hack")</script> <a href="http://evil.com">Clique</a>'
      expect(sanitizeCaption(malicious)).toBe('Confira nosso novo estoque! alert("hack") Clique')
    })

    it("preserves emojis, hashtags, and newlines cleanly", () => {
      const normal = "Manutenção de compressores ❄️🔧 #refrigeracao #friggafrio"
      expect(sanitizeCaption(normal)).toBe("Manutenção de compressores ❄️🔧 #refrigeracao #friggafrio")
    })

    it("returns empty string on null or undefined", () => {
      expect(sanitizeCaption(null)).toBe("")
      expect(sanitizeCaption(undefined)).toBe("")
    })
  })

  describe("isValidInstagramPermalink", () => {
    it("accepts valid official post and reel URLs", () => {
      expect(isValidInstagramPermalink("https://www.instagram.com/p/DA12345/")).toBe(true)
      expect(isValidInstagramPermalink("https://instagram.com/p/DA12345")).toBe(true)
      expect(isValidInstagramPermalink("https://www.instagram.com/reel/C-987xyz/")).toBe(true)
      expect(isValidInstagramPermalink("https://instagram.com/tv/B_xyz123/")).toBe(true)
    })

    it("rejects non-Instagram or malicious redirect URLs", () => {
      expect(isValidInstagramPermalink("https://evil.com/p/DA12345")).toBe(false)
      expect(isValidInstagramPermalink("https://instagram.com.evil.com/p/DA12345")).toBe(false)
      expect(isValidInstagramPermalink("javascript:alert(1)")).toBe(false)
      expect(isValidInstagramPermalink(null)).toBe(false)
    })
  })

  describe("isValidMediaUrl", () => {
    it("validates standard http and https URLs", () => {
      expect(isValidMediaUrl("https://scontent.cdninstagram.com/v/t51/123.jpg")).toBe(true)
      expect(isValidMediaUrl("http://example.com/img.png")).toBe(true)
    })

    it("rejects javascript:, file:, or malformed protocols", () => {
      expect(isValidMediaUrl("javascript:void(0)")).toBe(false)
      expect(isValidMediaUrl("file:///etc/passwd")).toBe(false)
      expect(isValidMediaUrl("not-a-url")).toBe(false)
    })
  })

  describe("normalizeMetaMediaItem", () => {
    it("normalizes an IMAGE post correctly", () => {
      const raw: MetaInstagramMediaItem = {
        id: "179001",
        caption: "Peças para refrigeração comercial ❄️",
        media_type: "IMAGE",
        media_url: "https://scontent.cdninstagram.com/img1.jpg",
        permalink: "https://www.instagram.com/p/CPiece1/",
        timestamp: "2026-10-20T12:00:00+0000",
      }

      const normalized = normalizeMetaMediaItem(raw)
      expect(normalized).not.toBeNull()
      expect(normalized?.id).toBe("ig_179001")
      expect(normalized?.instagram_id).toBe("179001")
      expect(normalized?.media_type).toBe("IMAGE")
      expect(normalized?.media_url).toBe("https://scontent.cdninstagram.com/img1.jpg")
      expect(normalized?.caption).toBe("Peças para refrigeração comercial ❄️")
      expect(normalized?.is_hidden).toBe(false)
    })

    it("normalizes a VIDEO post using thumbnail_url", () => {
      const raw: MetaInstagramMediaItem = {
        id: "179002",
        caption: "Vídeo técnico de compressores",
        media_type: "VIDEO",
        media_url: "https://video.cdninstagram.com/vid.mp4",
        thumbnail_url: "https://scontent.cdninstagram.com/thumb.jpg",
        permalink: "https://www.instagram.com/reel/CVideo1/",
        timestamp: "2026-10-21T15:30:00Z",
      }

      const normalized = normalizeMetaMediaItem(raw)
      expect(normalized).not.toBeNull()
      expect(normalized?.media_type).toBe("VIDEO")
      expect(normalized?.media_url).toBe("https://scontent.cdninstagram.com/thumb.jpg")
      expect(normalized?.thumbnail_url).toBe("https://scontent.cdninstagram.com/thumb.jpg")
    })

    it("normalizes a CAROUSEL_ALBUM correctly", () => {
      const raw: MetaInstagramMediaItem = {
        id: "179003",
        caption: "Carrossel com vários produtos",
        media_type: "CAROUSEL_ALBUM",
        media_url: "https://scontent.cdninstagram.com/slide1.jpg",
        permalink: "https://www.instagram.com/p/CCarousel/",
      }

      const normalized = normalizeMetaMediaItem(raw)
      expect(normalized).not.toBeNull()
      expect(normalized?.media_type).toBe("CAROUSEL_ALBUM")
      expect(normalized?.media_url).toBe("https://scontent.cdninstagram.com/slide1.jpg")
    })

    it("rejects items without ID or with invalid permalink", () => {
      const badId: MetaInstagramMediaItem = {
        id: "",
        media_type: "IMAGE",
        media_url: "https://example.com/img.jpg",
        permalink: "https://www.instagram.com/p/C123/",
      }
      expect(normalizeMetaMediaItem(badId)).toBeNull()

      const badLink: MetaInstagramMediaItem = {
        id: "123",
        media_type: "IMAGE",
        media_url: "https://example.com/img.jpg",
        permalink: "https://phishing.com/p/C123/",
      }
      expect(normalizeMetaMediaItem(badLink)).toBeNull()
    })
  })

  describe("InstagramApiClient", () => {
    it("reports unconfigured when token is absent", () => {
      const client = new InstagramApiClient({ accessToken: "" })
      expect(client.isConfigured()).toBe(false)
      expect(client.getMaskedToken()).toBeNull()
    })

    it("masks token safely", () => {
      const client = new InstagramApiClient({ accessToken: "IGQVJXN123456789SecretTokenABC" })
      expect(client.isConfigured()).toBe(true)
      expect(client.getMaskedToken()).toBe("IGQV...nABC")
    })

    it("throws clear error when fetching without configuration", async () => {
      const client = new InstagramApiClient({ accessToken: "" })
      await expect(client.fetchRecentMedia()).rejects.toThrow("INSTAGRAM_NOT_CONFIGURED")
    })
  })
})
