import { sdk } from "@/lib/medusa"
import type { InstagramFeedResponse } from "@/components/instagram/instagram.types"

const FALLBACK_PROFILE = {
  handle: "@frigga.frio",
  profile_url: "https://www.instagram.com/frigga.frio/",
}

export async function getInstagramFeed(): Promise<InstagramFeedResponse> {
  try {
    const data = await sdk.client.fetch<InstagramFeedResponse>("/store/instagram-feed", {
      method: "GET",
    })

    if (data && Array.isArray(data.posts)) {
      return data
    }

    return {
      posts: [],
      count: 0,
      last_sync_at: null,
      profile: FALLBACK_PROFILE,
    }
  } catch {
    return {
      posts: [],
      count: 0,
      last_sync_at: null,
      profile: FALLBACK_PROFILE,
    }
  }
}
