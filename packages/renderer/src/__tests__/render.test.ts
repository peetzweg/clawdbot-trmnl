import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { render } from '../render.ts';

describe('render', () => {
  it('renders simple content without overflow', async () => {
    const result = await render(
      '<div class="layout layout--col layout--center" style="height: 100%; padding: 40px;"><span class="value value--xxlarge">Hello</span></div>',
    );

    expect(result.screenshotPath).toBeTruthy();
    expect(existsSync(result.screenshotPath)).toBe(true);
    expect(result.overflow.overflows).toBe(false);
    expect(result.overflow.right).toBe(0);
    expect(result.renderTimeMs).toBeGreaterThan(0);
    expect(result.frameworkVersion).toBeTruthy();
  }, 30_000);

  it('detects right overflow on wide content', async () => {
    const result = await render(
      '<div class="layout" style="width: 1200px;"><span>Too wide</span></div>',
    );

    expect(result.overflow.overflows).toBe(true);
    expect(result.overflow.right).toBeGreaterThan(0);
  }, 30_000);

  it('detects bottom overflow on tall content', async () => {
    // Generate enough content to overflow vertically
    const items = Array.from({ length: 30 }, (_, i) => `<div class="item"><span class="value value--xlarge">Item ${i}</span></div>`).join('');
    const result = await render(
      `<div class="layout layout--col">${items}</div>`,
    );

    expect(result.overflow.overflows).toBe(true);
    expect(result.overflow.bottom).toBeGreaterThan(0);
  }, 30_000);

  it('saves screenshot to custom path', async () => {
    const outputPath = `/tmp/trmnl-test-${Date.now()}.png`;
    const result = await render(
      '<div class="layout"><span>Custom path</span></div>',
      { outputPath },
    );

    expect(result.screenshotPath).toBe(outputPath);
    expect(existsSync(outputPath)).toBe(true);
  }, 30_000);

  it('respects custom viewport dimensions', async () => {
    const result = await render(
      '<div class="layout"><span>Small viewport</span></div>',
      { width: 400, height: 300 },
    );

    expect(result.screenshotPath).toBeTruthy();
    expect(existsSync(result.screenshotPath)).toBe(true);
  }, 30_000);
});
