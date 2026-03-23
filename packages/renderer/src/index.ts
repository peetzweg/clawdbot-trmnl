/**
 * trmnl-renderer - TRMNL screen renderer for preview and validation
 *
 * Replicates the TRMNL rendering pipeline (Terminus community edition)
 * using Playwright to screenshot HTML at exact device viewport dimensions.
 */

export { render } from './render.ts';
export { getFramework, updateFramework, checkForUpdate, getFrameworkStatus } from './framework.ts';
export { detectOverflow } from './overflow.ts';
export { wrapContent } from './wrapper.ts';
export { DEVICE_PROFILES } from './types.ts';
export type {
  RenderOptions,
  RenderResult,
  OverflowResult,
  FrameworkInfo,
  FrameworkManifest,
  UpdateResult,
  DeviceId,
  BitDepth,
  WrapperOptions,
} from './types.ts';
