const fs = require('fs');
const file = '/c/Users/lluca/Documents/Codex/projeto friggagafrio/apps/storefront/src/components/home/store-brands-carousel/StoreBrandsCarousel.tsx';
let content = fs.readFileSync(file, 'utf8');

const oldContent = `import { useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { storeBrands } from "../../../config/brands"
import { BrandLogoCard } from "./BrandLogoCard"

export function StoreBrandsCarousel() {
  const activeBrands = storeBrands.filter((brand) => brand.active).sort((a, b) => a.order - b.order)

  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    dragFree: true,
  })`;

const newContent = `import { useCallback } from "react"
import useEmblaCarousel from "embla-carousel-react"
import Autoplay from "embla-carousel-autoplay"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { storeBrands } from "../../../config/brands"
import { BrandLogoCard } from "./BrandLogoCard"

export function StoreBrandsCarousel() {
  const activeBrands = storeBrands.filter((brand) => brand.active).sort((a, b) => a.order - b.order)

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "start",
      containScroll: "trimSnaps",
      dragFree: true,
      loop: true,
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  )`;

content = content.replace(/\r\n/g, '\n');
const normalizedOld = oldContent.replace(/\r\n/g, '\n');

if (content.includes(normalizedOld)) {
  content = content.replace(normalizedOld, newContent);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Success');
} else {
  console.log('Not found');
}
