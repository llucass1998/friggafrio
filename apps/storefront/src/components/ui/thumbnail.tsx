import { clsx } from "clsx"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"
import { resolveMediaUrl } from "@/lib/media-url"

type ThumbnailProps = {
  thumbnail?: string | null;
  alt: string;
  className?: string;
};

export const Thumbnail = ({ thumbnail, alt, className }: ThumbnailProps) => {
  const resolvedThumbnail = resolveMediaUrl(thumbnail)
  return (
    <>
      {resolvedThumbnail ? (
        <img
          src={resolvedThumbnail}
          alt={alt}
          className={clsx("w-20 h-20 object-cover bg-zinc-50", className)}
        />
      ) : (
        <ProductImagePlaceholder productName={alt} compact className={clsx("w-20 h-20", className)} />
      )}
    </>
  )
}
