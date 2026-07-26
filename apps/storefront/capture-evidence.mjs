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
  
  // Mobile
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('http://localhost:5173/br');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/frontend/evidence/carousel-after-mobile.png' });
  
  // 1440
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/frontend/evidence/carousel-after-1440.png' });
  
  // 1665
  await page.setViewportSize({ width: 1665, height: 1080 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/frontend/evidence/carousel-after-1665.png' });
  
  // 1920
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'docs/frontend/evidence/carousel-after-1920.png' });
  
  // Video recording
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(2000);
  
  // Click next button
  await page.locator('button[aria-label="Ver próximo slide"]').click();
  await page.waitForTimeout(2000);
  await page.locator('button[aria-label="Pausar apresentação"]').click();
  await page.waitForTimeout(1000);
  
  await context.close();
  await browser.close();
  
  // Rename video file
  import('fs').then(fs => {
    const files = fs.readdirSync('docs/frontend/evidence/');
    const videoFile = files.find(f => f.endsWith('.webm') && f !== 'carousel-animation.webm');
    if (videoFile) {
      fs.renameSync(`docs/frontend/evidence/${videoFile}`, 'docs/frontend/evidence/carousel-animation.webm');
    }
  });
  
  console.log("Evidências geradas com sucesso!");
})();
