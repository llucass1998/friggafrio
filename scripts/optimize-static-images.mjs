import sharp from "sharp";
import { statSync } from "node:fs";

const imagesToConvert = [
  {
    src: "apps/storefront/public/images/carousel/hero-refrigeracao.png",
    dest: "apps/storefront/public/images/carousel/hero-refrigeracao.webp",
    maxWidth: 1920,
    quality: 82,
  },
  {
    src: "apps/storefront/public/images/carousel/hero-entrega-sao-paulo.png",
    dest: "apps/storefront/public/images/carousel/hero-entrega-sao-paulo.webp",
    maxWidth: 1920,
    quality: 82,
  },
  {
    src: "apps/storefront/public/images/carousel/hero-atendimento-tecnico.png",
    dest: "apps/storefront/public/images/carousel/hero-atendimento-tecnico.webp",
    maxWidth: 1920,
    quality: 82,
  },
  {
    src: "apps/storefront/public/images/home/banner-orcamento-whatsapp-friggafrio-compacto.png",
    dest: "apps/storefront/public/images/home/banner-orcamento-whatsapp-friggafrio-compacto.webp",
    maxWidth: 1200,
    quality: 82,
  },
];

for (const item of imagesToConvert) {
  const statBefore = statSync(item.src);
  await sharp(item.src)
    .resize({ width: item.maxWidth, fit: "inside", withoutEnlargement: true })
    .webp({ quality: item.quality, effort: 6 })
    .toFile(item.dest);
  const statAfter = statSync(item.dest);
  console.log(
    `${item.src} (${Math.round(statBefore.size / 1024)} KB) -> ${item.dest} (${Math.round(statAfter.size / 1024)} KB) [Saved ${Math.round((1 - statAfter.size / statBefore.size) * 100)}%]`
  );
}
