/**
 * TRMNL Framework CSS/JS fetcher, cacher, and version manager.
 *
 * Downloads the TRMNL framework assets from the official CDN and caches
 * them locally with SHA-256 versioning. This mirrors how Terminus loads
 * assets from https://trmnl.com/css/latest/plugins.css and plugins.js.
 */

import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, renameSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { FrameworkInfo, FrameworkManifest, UpdateResult } from './types.ts';

const TRMNL_CSS_URL = 'https://trmnl.com/css/latest/plugins.css';
const TRMNL_JS_URL = 'https://trmnl.com/js/latest/plugins.js';

function getCacheDir(): string {
  const dir = join(homedir(), '.trmnl', 'cache', 'framework');
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getManifestPath(): string {
  return join(getCacheDir(), 'manifest.json');
}

function getCssPath(): string {
  return join(getCacheDir(), 'plugins.css');
}

function getJsPath(): string {
  return join(getCacheDir(), 'plugins.js');
}

function computeHash(css: string, js: string): string {
  const hash = createHash('sha256');
  hash.update(css);
  hash.update(js);
  return hash.digest('hex').slice(0, 16);
}

function readManifest(): FrameworkManifest | null {
  const path = getManifestPath();
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as FrameworkManifest;
  } catch {
    return null;
  }
}

function writeManifest(manifest: FrameworkManifest): void {
  writeFileSync(getManifestPath(), JSON.stringify(manifest, null, 2));
}

function isCached(): boolean {
  return existsSync(getCssPath()) && existsSync(getJsPath()) && readManifest() !== null;
}

/**
 * Fetch framework assets from CDN.
 */
async function fetchAssets(): Promise<{ css: string; js: string }> {
  const [cssResponse, jsResponse] = await Promise.all([
    fetch(TRMNL_CSS_URL),
    fetch(TRMNL_JS_URL),
  ]);

  if (!cssResponse.ok) {
    throw new Error(`Failed to fetch TRMNL CSS: ${cssResponse.status} ${cssResponse.statusText}`);
  }
  if (!jsResponse.ok) {
    throw new Error(`Failed to fetch TRMNL JS: ${jsResponse.status} ${jsResponse.statusText}`);
  }

  const css = await cssResponse.text();
  const js = await jsResponse.text();

  return { css, js };
}

/**
 * Save assets to cache and update manifest.
 */
function saveToCache(css: string, js: string): FrameworkManifest {
  const cacheDir = getCacheDir();
  const cssPath = getCssPath();
  const jsPath = getJsPath();

  // Backup previous versions if they exist
  if (existsSync(cssPath)) {
    renameSync(cssPath, join(cacheDir, 'plugins.css.prev'));
  }
  if (existsSync(jsPath)) {
    renameSync(jsPath, join(cacheDir, 'plugins.js.prev'));
  }

  writeFileSync(cssPath, css);
  writeFileSync(jsPath, js);

  const manifest: FrameworkManifest = {
    version: computeHash(css, js),
    fetchedAt: new Date().toISOString(),
    cssSize: Buffer.byteLength(css),
    jsSize: Buffer.byteLength(js),
    cssUrl: TRMNL_CSS_URL,
    jsUrl: TRMNL_JS_URL,
  };

  writeManifest(manifest);
  return manifest;
}

/**
 * Get the TRMNL framework, fetching from CDN if not cached.
 */
export async function getFramework(): Promise<FrameworkInfo> {
  if (isCached()) {
    const manifest = readManifest()!;
    return {
      cssPath: getCssPath(),
      jsPath: getJsPath(),
      version: manifest.version,
      fetchedAt: manifest.fetchedAt,
      size: { css: manifest.cssSize, js: manifest.jsSize },
    };
  }

  const { css, js } = await fetchAssets();
  const manifest = saveToCache(css, js);

  return {
    cssPath: getCssPath(),
    jsPath: getJsPath(),
    version: manifest.version,
    fetchedAt: manifest.fetchedAt,
    size: { css: manifest.cssSize, js: manifest.jsSize },
  };
}

/**
 * Force-update the framework from CDN.
 * Compares with cached version and reports whether it changed.
 */
export async function updateFramework(): Promise<UpdateResult> {
  const oldManifest = readManifest();
  const { css, js } = await fetchAssets();
  const newManifest = saveToCache(css, js);

  return {
    updated: oldManifest?.version !== newManifest.version,
    oldVersion: oldManifest?.version,
    newVersion: newManifest.version,
  };
}

/**
 * Check if a framework update is available without downloading.
 * Uses a HEAD request to check content-length changes.
 */
export async function checkForUpdate(): Promise<{ available: boolean; currentVersion: string | null }> {
  const manifest = readManifest();
  if (!manifest) {
    return { available: true, currentVersion: null };
  }

  try {
    const [cssHead, jsHead] = await Promise.all([
      fetch(TRMNL_CSS_URL, { method: 'HEAD' }),
      fetch(TRMNL_JS_URL, { method: 'HEAD' }),
    ]);

    const cssSize = Number(cssHead.headers.get('content-length') || 0);
    const jsSize = Number(jsHead.headers.get('content-length') || 0);

    // If sizes differ, an update is likely available
    const available = cssSize !== manifest.cssSize || jsSize !== manifest.jsSize;
    return { available, currentVersion: manifest.version };
  } catch {
    // Can't check, assume no update
    return { available: false, currentVersion: manifest.version };
  }
}

/**
 * Get the current cached framework info without fetching.
 * Returns null if not cached.
 */
export function getFrameworkStatus(): FrameworkInfo | null {
  if (!isCached()) return null;
  const manifest = readManifest()!;
  return {
    cssPath: getCssPath(),
    jsPath: getJsPath(),
    version: manifest.version,
    fetchedAt: manifest.fetchedAt,
    size: { css: manifest.cssSize, js: manifest.jsSize },
  };
}
