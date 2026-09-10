import { ChevronLeft, ChevronRight } from "@medusajs/icons"
import { HttpTypes } from "@medusajs/types"
import { useState, useCallback, memo, useEffect, useRef, type TouchEvent } from "react"
import { createPortal } from "react-dom"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"
import { resolveMediaUrl } from "@/lib/media-url"

type ImageGalleryProps = {
  images: HttpTypes.StoreProductImage[]
}

const ImageGallery = memo(function ImageGallery({ images }: ImageGalleryProps) {
  const galleryImages = images.filter((image, index, list) => Boolean(image.url?.trim()) && list.findIndex((candidate) => candidate.url === image.url) === index)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [fallbackImages, setFallbackImages] = useState<Set<string>>(new Set())
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)
  const touchStartX = useRef<number | null>(null)
  const thumbnailRefs = useRef<Array<HTMLButtonElement | null>>([])
  const imageKey = galleryImages.map((image) => image.id).join("|")

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => Math.min(prev + 1, galleryImages.length - 1))
  }, [galleryImages.length])

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  const openLightbox = useCallback(() => {
    triggerRef.current = document.activeElement as HTMLElement | null
    setLightboxOpen(true)
  }, [])

  const closeLightbox = useCallback(() => setLightboxOpen(false), [])

  const handleTouchStart = useCallback((event: TouchEvent) => {
    touchStartX.current = event.touches[0]?.clientX ?? null
  }, [])

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    const start = touchStartX.current
    touchStartX.current = null
    if (start === null || galleryImages.length < 2) return
    const delta = (event.changedTouches[0]?.clientX ?? start) - start
    if (Math.abs(delta) < 40) return
    if (delta < 0) goToNext()
    else goToPrevious()
  }, [goToNext, goToPrevious, galleryImages.length])

  useEffect(() => {
    if (!lightboxOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    closeButtonRef.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxOpen(false)
      if (event.key === "ArrowRight") goToNext()
      if (event.key === "ArrowLeft") goToPrevious()
      if (event.key === "Tab") {
        const dialog = closeButtonRef.current?.closest('[role="dialog"]')
        const focusables = dialog ? Array.from(dialog.querySelectorAll<HTMLElement>("button")) : []
        if (focusables.length > 1) {
          const first = focusables[0]
          const last = focusables[focusables.length - 1]
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault()
            last.focus()
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault()
            first.focus()
          }
        }
      }
    }
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = previousOverflow
      triggerRef.current?.focus()
    }
  }, [goToNext, goToPrevious, lightboxOpen])

  useEffect(() => {
    setCurrentIndex(0)
    thumbnailRefs.current = []
  }, [imageKey])

  useEffect(() => {
    thumbnailRefs.current[currentIndex]?.scrollIntoView({ block: "nearest", inline: "nearest" })
  }, [currentIndex])

  useEffect(() => {
    if (typeof document === "undefined") return
    const frame = window.requestAnimationFrame(() => {
      const readyIds = Array.from(document.querySelectorAll<HTMLImageElement>("img[data-gallery-image-id]"))
        .filter((image) => image.complete && image.naturalWidth > 0)
        .map((image) => image.dataset.galleryImageId)
        .filter((id): id is string => Boolean(id))
      if (readyIds.length === 0) return
      setLoadedImages((current) => new Set(Array.from(current).concat(readyIds)))
    })
    return () => window.cancelAnimationFrame(frame)
  }, [galleryImages])

  if (galleryImages.length === 0) return null

  return (
    <div className="product-gallery-root flex min-w-0 flex-col gap-3">
      {/* Main Image */}
      <div className="product-gallery-main relative order-1 aspect-square min-w-0 overflow-hidden rounded-lg bg-slate-50" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
        <div 
          className="flex transition-transform duration-300 ease-in-out h-full"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {galleryImages.map((image, index) => {
            const isFirstImage = index === 0
            const isCriticalImage = index === 0
            const imageUrl = resolveMediaUrl(image.url)
            const imageReady = loadedImages.has(image.id) && !failedImages.has(image.id)
            
            return (
              <div
                key={image.id}
                className="w-full h-full flex-shrink-0 relative"
              >
                  {!!imageUrl && !failedImages.has(image.id) ? (
                  <img
                    src={fallbackImages.has(image.id) ? image.url : imageUrl}
                    className={`absolute inset-0 h-full w-full object-contain transition-opacity ${imageReady ? "opacity-100" : "opacity-0"}`}
                    alt={isFirstImage ? "Imagem principal do produto" : `Imagem do produto ${index + 1}`}
                    loading={isCriticalImage ? "eager" : "lazy"}
                    fetchPriority={isFirstImage ? "high" : undefined}
                    decoding="async"
                    aria-hidden={!imageReady}
                    onLoad={() => setLoadedImages((current) => new Set(current).add(image.id))}
                    onError={() => {
                      if (image.url !== imageUrl && !fallbackImages.has(image.id)) {
                        setFallbackImages((current) => new Set(current).add(image.id))
                        return
                      }
                      setFailedImages((current) => new Set(current).add(image.id))
                    }}
                    onClick={openLightbox}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault()
                        openLightbox()
                      }
                    }}
                    tabIndex={imageReady ? 0 : -1}
                    role="button"
                    aria-label="Ampliar imagem do produto"
                    data-gallery-image-id={image.id}
                  />
                ) : (
                  <ProductImagePlaceholder productName="este produto" />
                )}
                {!imageReady && !failedImages.has(image.id) && <ProductImagePlaceholder productName="este produto" />}
              </div>
            )
          })}
        </div>
        
        {/* Navigation arrows */}
        {galleryImages.length > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrevious}
              disabled={currentIndex === 0}
              className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Imagem anterior"
            >
              <ChevronLeft className="w-5 h-5 text-slate-700" />
            </button>
            
            <button
              type="button"
              onClick={goToNext}
              disabled={currentIndex === galleryImages.length - 1}
              className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 shadow-md transition-colors hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Próxima imagem"
            >
              <ChevronRight className="w-5 h-5 text-slate-700" />
            </button>
          </>
        )}

        {/* Image counter */}
        {galleryImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 text-white text-sm rounded-full">
            {currentIndex + 1} / {galleryImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail strip */}
      {galleryImages.length > 1 && (
        <div className="order-2 flex min-w-0 gap-2 overflow-x-auto pb-1" aria-label="Miniaturas das imagens">
          {galleryImages.map((image, index) => (
            <button
              key={image.id}
              ref={(node) => { thumbnailRefs.current[index] = node }}
              type="button"
              onClick={() => setCurrentIndex(index)}
              aria-label={`Selecionar imagem ${index + 1}`}
              aria-current={index === currentIndex ? "true" : undefined}
              className={`flex h-[68px] w-[68px] flex-shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-white transition-all cursor-pointer sm:h-[72px] sm:w-[72px] ${
                index === currentIndex 
                  ? "border-accent ring-2 ring-accent/30" 
                  : "border-transparent hover:border-slate-300"
              }`}
            >
              <span className="relative flex h-full w-full items-center justify-center">
                <img
                  src={fallbackImages.has(image.id) ? image.url : resolveMediaUrl(image.url)}
                  alt={`Miniatura da imagem ${index + 1}`}
                  className={`h-full w-full object-contain transition-opacity ${loadedImages.has(image.id) && !failedImages.has(image.id) ? "opacity-100" : "opacity-0"}`}
                  loading="lazy"
                  aria-hidden={!loadedImages.has(image.id) || failedImages.has(image.id)}
                  onLoad={() => setLoadedImages((current) => new Set(current).add(image.id))}
                  onError={() => {
                    const resolved = resolveMediaUrl(image.url)
                    if (image.url !== resolved && !fallbackImages.has(image.id)) {
                      setFallbackImages((current) => new Set(current).add(image.id))
                      return
                    }
                    setFailedImages((current) => new Set(current).add(image.id))
                  }}
                />
                {(!loadedImages.has(image.id) || failedImages.has(image.id)) && <ProductImagePlaceholder productName="este produto" compact className="absolute inset-0" />}
              </span>
            </button>
          ))}
        </div>
      )}

      {lightboxOpen && !!resolveMediaUrl(galleryImages[currentIndex]?.url) && !failedImages.has(galleryImages[currentIndex].id) && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[10000] flex h-[100dvh] w-screen items-center justify-center bg-slate-950/90 p-3 sm:p-6"
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeLightbox() }}
          onClick={(event) => { if (event.target === event.currentTarget) closeLightbox() }}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div role="dialog" aria-modal="true" aria-labelledby="product-lightbox-title" className="relative flex h-[min(92dvh,900px)] w-[min(94vw,1200px)] items-center justify-center overflow-hidden rounded-xl bg-black/20 p-10 sm:p-14">
            <h2 id="product-lightbox-title" className="sr-only">Imagem ampliada do produto</h2>
            <img src={resolveMediaUrl(galleryImages[currentIndex].url)} alt={`Imagem ampliada do produto ${currentIndex + 1}`} className="max-h-full max-w-full object-contain" />
            <button ref={closeButtonRef} type="button" onClick={closeLightbox} aria-label="Fechar imagem ampliada" className="absolute right-3 top-3 z-10 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white text-2xl text-slate-900 shadow-lg focus-visible:outline-2 focus-visible:outline-white">×</button>
            {galleryImages.length > 1 && <>
              <button type="button" onClick={goToPrevious} disabled={currentIndex === 0} aria-label="Imagem anterior" className="absolute left-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronLeft className="h-5 w-5" aria-hidden="true" /></button>
              <button type="button" onClick={goToNext} disabled={currentIndex === galleryImages.length - 1} aria-label="Próxima imagem" className="absolute right-2 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow focus-visible:outline-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-40"><ChevronRight className="h-5 w-5" aria-hidden="true" /></button>
            </>}
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
})

ImageGallery.displayName = "ImageGallery"

export { ImageGallery }
export default ImageGallery
