import { readdirSync, statSync, copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, extname } from "node:path";

async function main() {
  const uploadDir = process.env.FILE_LOCAL_UPLOAD_DIR || "/home/srv/friggafrio/uploads";
  const backupDir = "/home/srv/friggafrio/uploads-backup-original";
  const isApply = process.argv.includes("--apply");

  if (!existsSync(uploadDir)) {
    console.error("Upload directory not found:", uploadDir);
    process.exit(1);
  }

  // Load sharp from deploy dependencies
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    try {
      const deploySharp = "/home/srv/friggafrio/Maestro-deploy/node_modules/.pnpm/sharp@0.35.3_@types+node@22.19.11/node_modules/sharp/lib/index.js";
      sharp = (await import(deploySharp)).default;
    } catch (e) {
      console.error("Could not load sharp:", e.message);
      process.exit(1);
    }
  }

  if (isApply && !existsSync(backupDir)) {
    console.log("Creating backup directory:", backupDir);
    mkdirSync(backupDir, { recursive: true });
  }

  const files = readdirSync(uploadDir);
  let totalBefore = 0;
  let totalAfter = 0;
  let processed = 0;

  console.log(`Found ${files.length} files in ${uploadDir}. Mode: ${isApply ? "APPLY" : "DRY-RUN"}`);

  for (const file of files) {
    const filePath = join(uploadDir, file);
    const stat = statSync(filePath);
    if (!stat.isFile()) continue;

    const ext = extname(file).toLowerCase();
    if (![".png", ".jpg", ".jpeg"].includes(ext)) {
      totalBefore += stat.size;
      totalAfter += stat.size;
      continue;
    }

    totalBefore += stat.size;
    try {
      let transformer = sharp(filePath).resize({
        width: 1000,
        height: 1000,
        fit: "inside",
        withoutEnlargement: true,
      });

      if (ext === ".png") {
        transformer = transformer.png({ quality: 80, effort: 8, palette: true });
      } else {
        transformer = transformer.jpeg({ quality: 80, mozjpeg: true });
      }

      const optimizedBuffer = await transformer.toBuffer();

      if (optimizedBuffer.length < stat.size) {
        totalAfter += optimizedBuffer.length;
        const savedPercent = Math.round((1 - optimizedBuffer.length / stat.size) * 100);
        console.log(`[OPT] ${file.slice(0, 45)}... : ${Math.round(stat.size / 1024)}KB -> ${Math.round(optimizedBuffer.length / 1024)}KB (-${savedPercent}%)`);

        if (isApply) {
          const backupPath = join(backupDir, file);
          if (!existsSync(backupPath)) {
            copyFileSync(filePath, backupPath);
          }
          writeFileSync(filePath, optimizedBuffer);
        }
        processed++;
      } else {
        totalAfter += stat.size;
        console.log(`[SKIP] ${file.slice(0, 45)}... : Already optimal`);
      }
    } catch (err) {
      totalAfter += stat.size;
      console.warn(`[WARN] Failed to process ${file}:`, err.message);
    }
  }

  console.log("-----------------------------------------");
  console.log(`Processed: ${processed} files`);
  console.log(`Total size before: ${(totalBefore / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total size after:  ${(totalAfter / (1024 * 1024)).toFixed(2)} MB`);
  console.log(`Total saved:       ${((totalBefore - totalAfter) / (1024 * 1024)).toFixed(2)} MB (-${Math.round((1 - totalAfter / totalBefore) * 100)}%)`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
