/**
 * Overflow detection for TRMNL screens.
 *
 * Runs inside the browser page to measure whether content
 * extends beyond the device viewport dimensions.
 */

import type { Page } from 'playwright';
import type { OverflowResult } from './types.ts';

/**
 * Detect content overflow by measuring whether any rendered elements
 * extend outside the viewport boundaries.
 *
 * Uses getBoundingClientRect() on all direct children of .view to find
 * the actual rendered extent. This works even when the TRMNL framework
 * CSS clips overflow, because bounding rects reflect the positioned
 * layout before clipping.
 */
export async function detectOverflow(page: Page): Promise<OverflowResult> {
  return page.evaluate(() => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Find the user's content root (first child of .view, or .layout)
    const view = document.querySelector('.view');
    const layout = document.querySelector('.layout') || view?.firstElementChild;

    if (!layout) {
      return { right: 0, bottom: 0, overflows: false, contentWidth: viewportWidth, contentHeight: viewportHeight };
    }

    // Get ALL descendants and find the extreme bounding box
    const allElements = layout.querySelectorAll('*');
    let minLeft = Infinity;
    let minTop = Infinity;
    let maxRight = -Infinity;
    let maxBottom = -Infinity;

    // Include the layout element itself
    const layoutRect = layout.getBoundingClientRect();
    minLeft = Math.min(minLeft, layoutRect.left);
    minTop = Math.min(minTop, layoutRect.top);
    maxRight = Math.max(maxRight, layoutRect.right);
    maxBottom = Math.max(maxBottom, layoutRect.bottom);

    for (let i = 0; i < allElements.length; i++) {
      const rect = allElements[i]!.getBoundingClientRect();
      // Skip zero-size elements (hidden, collapsed)
      if (rect.width === 0 && rect.height === 0) continue;
      minLeft = Math.min(minLeft, rect.left);
      minTop = Math.min(minTop, rect.top);
      maxRight = Math.max(maxRight, rect.right);
      maxBottom = Math.max(maxBottom, rect.bottom);
    }

    // Content dimensions based on the full extent
    const contentWidth = Math.ceil(maxRight - Math.min(0, minLeft));
    const contentHeight = Math.ceil(maxBottom - Math.min(0, minTop));

    // Overflow = content extending past viewport edges
    const right = Math.max(0, Math.ceil(maxRight) - viewportWidth);
    const bottom = Math.max(0, Math.ceil(maxBottom) - viewportHeight);
    // Also check if content extends above/left of viewport (due to centering)
    const top = Math.max(0, -Math.floor(minTop));
    const left = Math.max(0, -Math.floor(minLeft));

    const overflowRight = right + left;  // total horizontal overflow
    const overflowBottom = bottom + top;  // total vertical overflow

    return {
      right: overflowRight,
      bottom: overflowBottom,
      overflows: overflowRight > 0 || overflowBottom > 0,
      contentWidth,
      contentHeight,
    };
  });
}
