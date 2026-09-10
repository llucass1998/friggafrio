export interface ShowcaseSlide {
  id: string
  title: string
  description: string
  ctaText: string
  ctaLink: string
  imageFilename?: string
  imageDesktop: string
  imageMobile?: string
  alt: string
  href: string
  isPromotionalImage?: boolean
  hideOverlayContent?: boolean
  imageFit?: "contain" | "cover"
  objectPosition?: string
  objectPositionMobile?: string
}
