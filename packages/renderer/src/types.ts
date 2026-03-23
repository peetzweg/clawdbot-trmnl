/**
 * TRMNL Renderer Types
 */

/** Device profiles with screen dimensions */
export const DEVICE_PROFILES = {
  og: { width: 800, height: 480, class: 'screen--og', bitDepth: '2bit' as const },
  v2: { width: 1040, height: 780, class: 'screen--v2', bitDepth: '4bit' as const },
  x: { width: 1872, height: 1404, class: 'screen--x', bitDepth: '4bit' as const },
} as const;

export type DeviceId = keyof typeof DEVICE_PROFILES;

export type BitDepth = '1bit' | '2bit' | '4bit';

export interface RenderOptions {
  /** Device width in pixels (default: 800) */
  width?: number;
  /** Device height in pixels (default: 480) */
  height?: number;
  /** TRMNL device CSS class (default: 'screen--og') */
  deviceClass?: string;
  /** E-ink bit depth (default: '2bit') */
  bitDepth?: BitDepth;
  /** Apply grayscale filter (default: true) */
  grayscale?: boolean;
  /** Screenshot output path (default: auto-generated) */
  outputPath?: string;
  /** Rendering timeout in ms (default: 10000) */
  timeout?: number;
}

export interface OverflowResult {
  /** Pixels content extends beyond viewport width */
  right: number;
  /** Pixels content extends beyond viewport height */
  bottom: number;
  /** True if content overflows in either direction */
  overflows: boolean;
  /** Actual content width */
  contentWidth: number;
  /** Actual content height */
  contentHeight: number;
}

export interface RenderResult {
  /** Path to the saved screenshot PNG */
  screenshotPath: string;
  /** Overflow detection results */
  overflow: OverflowResult;
  /** Content dimensions */
  dimensions: { contentWidth: number; contentHeight: number };
  /** Time taken to render in ms */
  renderTimeMs: number;
  /** Version hash of the cached framework */
  frameworkVersion: string;
}

export interface FrameworkManifest {
  /** SHA-256 hash of CSS+JS content */
  version: string;
  /** ISO timestamp of when assets were fetched */
  fetchedAt: string;
  /** CSS file size in bytes */
  cssSize: number;
  /** JS file size in bytes */
  jsSize: number;
  /** Source CSS URL */
  cssUrl: string;
  /** Source JS URL */
  jsUrl: string;
}

export interface FrameworkInfo {
  /** Local path to cached CSS file */
  cssPath: string;
  /** Local path to cached JS file */
  jsPath: string;
  /** Version hash */
  version: string;
  /** When assets were fetched */
  fetchedAt: string;
  /** File sizes */
  size: { css: number; js: number };
}

export interface UpdateResult {
  /** Whether the framework was updated */
  updated: boolean;
  /** Previous version hash (if was cached) */
  oldVersion?: string;
  /** Current version hash */
  newVersion: string;
}

export interface WrapperOptions {
  /** Local path to cached CSS file */
  cssPath: string;
  /** Local path to cached JS file */
  jsPath: string;
  /** Device CSS class */
  deviceClass: string;
  /** Bit depth class */
  bitDepth: string;
}
