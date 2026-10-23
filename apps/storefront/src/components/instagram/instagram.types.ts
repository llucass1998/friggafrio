export type InstagramMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"

export interface InstagramPost {
  id: string
  instagram_id: string
  caption: string
  media_type: InstagramMediaType
  media_url: string
  thumbnail_url?: string | null
  permalink: string
  timestamp?: string | null
}

export interface InstagramProfile {
  handle: string
  profile_url: string
}

export interface InstagramFeedResponse {
  posts: InstagramPost[]
  count: number
  last_sync_at?: string | null
  profile: InstagramProfile
}
