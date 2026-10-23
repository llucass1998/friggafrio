export type MetaMediaType = "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM"

export interface MetaInstagramMediaItem {
  id: string
  caption?: string
  media_type: MetaMediaType
  media_url?: string
  thumbnail_url?: string
  permalink?: string
  timestamp?: string
  children?: {
    data: Array<{
      id: string
      media_type: MetaMediaType
      media_url?: string
    }>
  }
}

export interface MetaInstagramMediaResponse {
  data?: MetaInstagramMediaItem[]
  paging?: {
    cursors?: {
      before?: string
      after?: string
    }
    next?: string
  }
  error?: {
    message: string
    type: string
    code: number
    error_subcode?: number
    fbtrace_id?: string
  }
}

export interface NormalizedInstagramPost {
  id: string
  instagram_id: string
  caption: string
  media_type: MetaMediaType
  media_url: string
  thumbnail_url: string | null
  permalink: string
  timestamp: string | null
  is_hidden: boolean
}

export interface InstagramSyncResult {
  success: boolean
  synced_count: number
  total_count: number
  error?: string
  synced_at: string
}
