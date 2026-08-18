import { clsx } from "clsx"
import { ProductImagePlaceholder } from "@/components/product/ProductImagePlaceholder"

type ThumbnailProps = {
  thumbnail?: string | null;
  alt: string;
  className?: string;
};

export const Thumbnail = ({ thumbnail, alt, className }: ThumbnailProps) => {
  return (
    <>
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={alt}
          className={clsx("w-20 h-20 object-cover bg-zinc-50", className)}
        />
      ) : (
        <ProductImagePlaceholder productName={alt} compact className={clsx("w-20 h-20", className)} />
      )}
    </>
  )
}
