/**
 * trmnl preview - Render and preview TRMNL content locally
 */

import { readFileSync } from 'node:fs';
import { exec } from 'node:child_process';
import type { CAC } from 'cac';

interface PreviewOptions {
  content?: string;
  file?: string;
  output?: string;
  open?: boolean;
  device?: string;
  overflowCheck?: boolean;
  json?: boolean;
  updateFramework?: boolean;
}

const DEVICE_MAP: Record<string, { width: number; height: number; class: string; bitDepth: string }> = {
  og: { width: 800, height: 480, class: 'screen--og', bitDepth: '2bit' },
  v2: { width: 1040, height: 780, class: 'screen--v2', bitDepth: '4bit' },
  x: { width: 1872, height: 1404, class: 'screen--x', bitDepth: '4bit' },
};

export function registerPreviewCommand(cli: CAC): void {
  cli
    .command('preview', 'Render and preview TRMNL content locally')
    .option('-c, --content <html>', 'HTML content to preview')
    .option('-f, --file <path>', 'Read content from file')
    .option('-o, --output <path>', 'Screenshot output path')
    .option('--open', 'Open screenshot in default viewer')
    .option('--device <id>', 'Device profile: og, v2, x (default: og)')
    .option('--no-overflow-check', 'Skip overflow detection')
    .option('--json', 'Output result as JSON')
    .option('--update-framework', 'Force-update cached TRMNL framework before rendering')
    .example('trmnl preview --file ./output.html')
    .example('trmnl preview --file ./output.html --open')
    .example('trmnl preview --content "<div class=\\"layout\\">Hello</div>" --json')
    .example('echo \'<div class="layout">Hello</div>\' | trmnl preview')
    .action(async (options: PreviewOptions) => {
      let content: string;

      // Get content from options, file, or stdin
      if (options.content) {
        content = options.content;
      } else if (options.file) {
        try {
          content = readFileSync(options.file, 'utf-8');
        } catch {
          console.error(`Error reading file: ${options.file}`);
          process.exit(1);
        }
      } else {
        content = await readStdin();
        if (!content) {
          console.error('No content provided. Use --content, --file, or pipe content via stdin.');
          process.exit(1);
        }
      }

      // Dynamically import renderer (it has playwright as dependency)
      let renderer: typeof import('trmnl-renderer');
      try {
        renderer = await import('trmnl-renderer');
      } catch {
        console.error('trmnl-renderer package not found.');
        console.error('Run: pnpm add trmnl-renderer');
        process.exit(1);
      }

      // Update framework if requested
      if (options.updateFramework) {
        if (!options.json) {
          console.log('Updating TRMNL framework...');
        }
        const update = await renderer.updateFramework();
        if (!options.json) {
          if (update.updated) {
            console.log(`  Framework updated: ${update.oldVersion ?? 'none'} → ${update.newVersion}`);
          } else {
            console.log(`  Framework up-to-date: ${update.newVersion}`);
          }
        }
      }

      // Resolve device profile
      const deviceId = options.device || 'og';
      const device = DEVICE_MAP[deviceId];
      if (!device) {
        console.error(`Unknown device: ${deviceId}. Available: ${Object.keys(DEVICE_MAP).join(', ')}`);
        process.exit(1);
      }

      try {
        const result = await renderer.render(content, {
          width: device.width,
          height: device.height,
          deviceClass: device.class,
          bitDepth: device.bitDepth as '1bit' | '2bit' | '4bit',
          outputPath: options.output,
        });

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(`\u2713 Preview: ${result.screenshotPath}`);
          console.log(`  Device: ${deviceId.toUpperCase()} (${device.width}x${device.height}, ${device.bitDepth})`);
          console.log(`  Framework: ${result.frameworkVersion}`);
          console.log(`  Render time: ${result.renderTimeMs}ms`);

          if (result.overflow.overflows) {
            console.log('');
            console.log('  \u26a0 Overflow detected!');
            if (result.overflow.right > 0) {
              console.log(`    Right: +${result.overflow.right}px beyond viewport`);
            }
            if (result.overflow.bottom > 0) {
              console.log(`    Bottom: +${result.overflow.bottom}px beyond viewport`);
            }
            console.log('    \u2192 Reduce content size or use TRMNL grid/overflow classes');
          } else {
            console.log('  Overflow: none');
          }
        }

        // Open in default viewer if requested
        if (options.open) {
          const cmd = process.platform === 'darwin' ? 'open' :
                      process.platform === 'win32' ? 'start' : 'xdg-open';
          exec(`${cmd} "${result.screenshotPath}"`);
        }

        process.exit(result.overflow.overflows ? 1 : 0);
      } catch (error) {
        if (!options.json) {
          console.error(`\u2717 Preview failed: ${error instanceof Error ? error.message : error}`);
          if (String(error).includes('Executable doesn\'t exist')) {
            console.error('');
            console.error('Playwright browsers not installed. Run:');
            console.error('  npx playwright install chromium');
          }
        } else {
          console.log(JSON.stringify({ error: String(error) }));
        }
        process.exit(1);
      }
    });
}

async function readStdin(): Promise<string> {
  if (process.stdin.isTTY) {
    return '';
  }

  const chunks: Buffer[] = [];

  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8').trim()));
    process.stdin.on('error', () => resolve(''));

    setTimeout(() => {
      if (chunks.length === 0) {
        resolve('');
      }
    }, 100);
  });
}
