import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    recordVideo: {
      dir: 'docs/frontend/evidence/',
      size: { width: 1440, height: 900 }
    }
  });
  
  const page = await context.newPage();
  
  // Video recording
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/br');
  await page.waitForTimeout(2000);
  
  // Click next button
  await page.locator('button[aria-label="Ir para o slide 3"]').click();
  await page.waitForTimeout(2000);
  await page.locator('button[aria-label="Pausar apresentação"]').click();
  await page.waitForTimeout(1000);
  
  await context.close();
  await browser.close();
  
  // Rename video file
  import('fs').then(fs => {
    const files = fs.readdirSync('docs/frontend/evidence/');
    const videoFile = files.find(f => f.endsWith('.webm') && f !== 'carousel-animation.webm' && f !== 'hero-dots-click.webm' && f !== 'hero-autoplay.webm');
    if (videoFile) {
      fs.renameSync(`docs/frontend/evidence/${videoFile}`, 'docs/frontend/evidence/hero-dots-click.webm');
    }
  });
  
  console.log("Evidências de vídeo do clique geradas com sucesso!");
})();
