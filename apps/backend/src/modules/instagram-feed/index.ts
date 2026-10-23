import { Module } from "@medusajs/framework/utils"
import InstagramFeedService from "./service"

export const INSTAGRAM_FEED_MODULE = "instagramFeed"

export default Module(INSTAGRAM_FEED_MODULE, {
  service: InstagramFeedService,
})
