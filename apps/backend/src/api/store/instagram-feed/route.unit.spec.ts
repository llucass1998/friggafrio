import { GET as getStoreFeed } from "./route"
import { GET as getAdminFeed, POST as postAdminSync } from "../../admin/instagram-feed/route"
import { POST as postToggleHide } from "../../admin/instagram-feed/posts/[id]/toggle-hide/route"

describe("Instagram Feed API Routes", () => {
  describe("GET /store/instagram-feed", () => {
    it("returns public posts and profile when module is present", async () => {
      const mockPosts = [
        {
          id: "ig_1",
          instagram_id: "1",
          caption: "Post 1",
          media_type: "IMAGE",
          media_url: "https://cdn.instagram.com/1.jpg",
          thumbnail_url: null,
          permalink: "https://www.instagram.com/p/1/",
          timestamp: new Date("2026-10-20T10:00:00Z"),
          is_hidden: false,
        },
      ]

      const mockFeedService = {
        getPublicFeed: jest.fn().mockResolvedValue(mockPosts),
        getSyncState: jest.fn().mockResolvedValue({
          last_sync_at: new Date("2026-10-22T12:00:00Z"),
        }),
      }

      const req: any = {
        scope: {
          resolve: jest.fn().mockReturnValue(mockFeedService),
        },
      }

      let statusCode = 0
      let responseBody: any = null

      const res: any = {
        status: (code: number) => {
          statusCode = code
          return {
            json: (body: any) => {
              responseBody = body
            },
          }
        },
      }

      await getStoreFeed(req, res)

      expect(statusCode).toBe(200)
      expect(responseBody.count).toBe(1)
      expect(responseBody.posts[0].id).toBe("ig_1")
      expect(responseBody.profile.handle).toBe("@frigga.frio")
      expect(responseBody.profile.profile_url).toBe("https://www.instagram.com/frigga.frio/")
      expect(responseBody.last_sync_at).toBe("2026-10-22T12:00:00.000Z")
    })

    it("returns graceful empty response if module is not registered or throws", async () => {
      const req: any = {
        scope: {
          resolve: jest.fn().mockReturnValue(undefined),
        },
      }

      let statusCode = 0
      let responseBody: any = null

      const res: any = {
        status: (code: number) => {
          statusCode = code
          return {
            json: (body: any) => {
              responseBody = body
            },
          }
        },
      }

      await getStoreFeed(req, res)

      expect(statusCode).toBe(200)
      expect(responseBody.count).toBe(0)
      expect(responseBody.posts).toEqual([])
      expect(responseBody.profile.handle).toBe("@frigga.frio")
    })
  })

  describe("Admin Routes", () => {
    it("GET /admin/instagram-feed returns sync state and unconfigured flag safely", async () => {
      const mockFeedService = {
        getAllPosts: jest.fn().mockResolvedValue({ posts: [], count: 0 }),
        getSyncState: jest.fn().mockResolvedValue({
          last_sync_at: null,
          last_sync_status: "idle",
          posts_count: 0,
        }),
      }

      const req: any = {
        scope: {
          resolve: jest.fn().mockReturnValue(mockFeedService),
        },
      }

      let statusCode = 0
      let responseBody: any = null

      const res: any = {
        status: (code: number) => {
          statusCode = code
          return {
            json: (body: any) => {
              responseBody = body
            },
          }
        },
      }

      await getAdminFeed(req, res)
      expect(statusCode).toBe(200)
      expect(responseBody).toHaveProperty("configured")
      expect(responseBody).toHaveProperty("sync_state")
    })

    it("POST /admin/instagram-feed/posts/:id/toggle-hide toggles visibility", async () => {
      const mockFeedService = {
        togglePostVisibility: jest.fn().mockResolvedValue({
          id: "ig_1",
          is_hidden: true,
        }),
      }

      const req: any = {
        params: { id: "ig_1" },
        scope: {
          resolve: jest.fn().mockReturnValue(mockFeedService),
        },
      }

      let statusCode = 0
      let responseBody: any = null

      const res: any = {
        status: (code: number) => {
          statusCode = code
          return {
            json: (body: any) => {
              responseBody = body
            },
          }
        },
      }

      await postToggleHide(req, res)
      expect(statusCode).toBe(200)
      expect(responseBody.success).toBe(true)
      expect(responseBody.post.is_hidden).toBe(true)
      expect(mockFeedService.togglePostVisibility).toHaveBeenCalledWith("ig_1")
    })
  })
})
