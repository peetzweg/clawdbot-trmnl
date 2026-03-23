/**
 * HTML wrapper that replicates the Terminus extension.html.erb layout.
 *
 * Source: terminus/app/templates/layouts/extension.html.erb
 */

import type { WrapperOptions } from './types.ts';

/**
 * Wraps plugin HTML content in the full TRMNL page structure.
 * Matches the exact layout used by Terminus for rendering.
 */
export function wrapContent(html: string, options: WrapperOptions): string {
  const { cssPath, jsPath, deviceClass, bitDepth } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,shrink-to-fit=no">
  <meta charset="utf-8">
  <meta name="description" content="TRMNL Preview">

  <link rel="stylesheet" href="file://${cssPath}">

  <style type="text/css">
    .trmnl {
      align-items: center;
      display: flex;
      flex-direction: column;
      justify-content: center;
    }
  </style>

  <script src="file://${jsPath}"></script>
</head>
<body class="trmnl">
  <div class="screen ${deviceClass} ${bitDepth}">
    <div class="view view--full">
      ${html}
    </div>
  </div>
</body>
</html>`;
}
