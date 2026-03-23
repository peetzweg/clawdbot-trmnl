/**
 * Core TRMNL rendering engine.
 *
 * Replicates the Terminus rendering pipeline:
 * 1. Wrap content in TRMNL layout (extension.html.erb)
 * 2. Load in headless Chromium at exact device viewport
 * 3. Wait for TRMNL JS engines (terminalize) to process
 * 4. Detect overflow
 * 5. Take screenshot
 *
 * Source: terminus/app/aspects/screens/shoter.rb
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { chromium } from 'playwright';
import { getFramework } from './framework.ts';
import { detectOverflow } from './overflow.ts';
import { wrapContent } from './wrapper.ts';
import type { RenderOptions, RenderResult } from './types.ts';

const DEFAULT_OPTIONS: Required<RenderOptions> = {
  width: 800,
  height: 480,
  deviceClass: 'screen--og',
  bitDepth: '2bit',
  grayscale: true,
  outputPath: '',
  timeout: 10_000,
};

function getPreviewsDir(): string {
  const dir = join(homedir(), '.trmnl', 'previews');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function generateOutputPath(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return join(getPreviewsDir(), `preview-${timestamp}.png`);
}

/**
 * Render TRMNL HTML content to a screenshot PNG.
 *
 * Mirrors the Terminus Shoter pipeline:
 * - Ferrum (headless Chrome) → Playwright (headless Chromium)
 * - Same viewport, same wait-for-idle pattern
 * - Same Chrome flags (disable-dev-shm-usage, disable-gpu, hide-scrollbar, no-sandbox)
 */
export async function render(html: string, options?: RenderOptions): Promise<RenderResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const outputPath = opts.outputPath || generateOutputPath();
  const startTime = performance.now();

  // 1. Get framework (fetches from CDN if not cached)
  const framework = await getFramework();

  // 2. Build full HTML page (mirrors extension.html.erb)
  const fullHtml = wrapContent(html, {
    cssPath: framework.cssPath,
    jsPath: framework.jsPath,
    deviceClass: opts.deviceClass,
    bitDepth: opts.bitDepth,
  });

  // 3. Write to temp file
  const tempPath = join(tmpdir(), `trmnl-preview-${Date.now()}.html`);
  writeFileSync(tempPath, fullHtml);

  // 4. Launch headless Chromium (same flags as Terminus Shoter::OPTIONS)
  const browser = await chromium.launch({
    args: [
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--hide-scrollbars',
      '--no-sandbox',
    ],
  });

  try {
    const page = await browser.newPage({
      viewport: { width: opts.width, height: opts.height },
    });

    // 5. Navigate and wait (mirrors Ferrum's network.wait_for_idle duration: 1)
    await page.goto(`file://${tempPath}`, {
      waitUntil: 'networkidle',
      timeout: opts.timeout,
    });

    // 6. Wait for terminalize() to complete
    // The TRMNL JS fires 'trmnl:terminalize:stats' when done
    await page.evaluate(() => new Promise<void>((resolve) => {
      // Check if terminalize already ran
      const stats = (document as any).__trmnlStats;
      if (stats) {
        resolve();
        return;
      }

      document.addEventListener('trmnl:terminalize:stats', () => resolve(), { once: true });

      // Fallback timeout in case the event never fires
      setTimeout(resolve, 2000);
    }));

    // 7. Detect overflow
    const overflow = await detectOverflow(page);

    // 8. Take screenshot
    if (opts.grayscale) {
      // Apply grayscale filter to simulate e-ink
      await page.evaluate(() => {
        document.body.style.filter = 'grayscale(100%)';
      });
    }

    await page.screenshot({
      path: outputPath,
      type: 'png',
      clip: { x: 0, y: 0, width: opts.width, height: opts.height },
    });

    const renderTimeMs = Math.round(performance.now() - startTime);

    return {
      screenshotPath: outputPath,
      overflow,
      dimensions: {
        contentWidth: overflow.contentWidth,
        contentHeight: overflow.contentHeight,
      },
      renderTimeMs,
      frameworkVersion: framework.version,
    };
  } finally {
    await browser.close();

    // Clean up temp file
    try {
      const { unlinkSync } = await import('node:fs');
      unlinkSync(tempPath);
    } catch {
      // Ignore cleanup errors
    }
  }
}
