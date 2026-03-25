/**
 * trmnl send - Send content to TRMNL display
 */

import { readFileSync } from 'node:fs';
import type { CAC } from 'cac';
import { readStdin } from '../lib/stdin.ts';
import { createPayload, formatValidation } from '../lib/validator.ts';
import { sendToWebhook } from '../lib/webhook.ts';

interface SendOptions {
  content?: string;
  file?: string;
  plugin?: string;
  webhook?: string;
  skipValidation?: boolean;
  skipLog?: boolean;
  noMinify?: boolean;
  json?: boolean;
  preview?: boolean;
  force?: boolean;
}

export function registerSendCommand(cli: CAC): void {
  cli
    .command('send', 'Send content to TRMNL display')
    .option('-c, --content <html>', 'HTML content to send')
    .option('-f, --file <path>', 'Read content from file')
    .option('-p, --plugin <name>', 'Plugin to use (default: default plugin)')
    .option('-w, --webhook <url>', 'Override webhook URL directly')
    .option('--skip-validation', 'Skip payload validation')
    .option('--skip-log', 'Skip history logging')
    .option('--no-minify', 'Disable HTML minification (enabled by default)')
    .option('--preview', 'Preview render before sending (blocks on overflow)')
    .option('--force', 'Send even if preview detects overflow')
    .option('--json', 'Output result as JSON')
    .example('trmnl send --content "<div class=\\"layout\\">Hello</div>"')
    .example('trmnl send --file ./output.html')
    .example('trmnl send --file ./output.html --plugin office')
    .example('echo \'{"merge_variables":{"content":"..."}}\' | trmnl send')
    .action(async (options: SendOptions) => {
      let content: string;

      // Get content from options, file, or stdin
      if (options.content) {
        content = options.content;
      } else if (options.file) {
        try {
          content = readFileSync(options.file, 'utf-8');
        } catch (err) {
          console.error(`Error reading file: ${options.file}`);
          process.exit(1);
        }
      } else {
        // Try reading from stdin
        content = await readStdin();
        if (!content) {
          console.error('No content provided. Use --content, --file, or pipe content via stdin.');
          process.exit(1);
        }
      }

      // Preview check if requested
      if (options.preview) {
        try {
          const renderer = await import('trmnl-renderer');
          const previewResult = await renderer.render(content);

          if (previewResult.overflow.overflows) {
            console.error('\u26a0 Preview detected overflow:');
            if (previewResult.overflow.right > 0) {
              console.error(`  Right: +${previewResult.overflow.right}px beyond viewport`);
            }
            if (previewResult.overflow.bottom > 0) {
              console.error(`  Bottom: +${previewResult.overflow.bottom}px beyond viewport`);
            }
            console.error(`  Screenshot: ${previewResult.screenshotPath}`);

            if (!options.force) {
              console.error('\nSend blocked. Use --force to send anyway.');
              process.exit(1);
            }
            console.log('  Sending anyway (--force)');
          } else if (!options.json) {
            console.log(`\u2713 Preview OK (${previewResult.renderTimeMs}ms)`);
          }
        } catch (error) {
          console.error(`\u26a0 Preview failed: ${error instanceof Error ? error.message : error}`);
          if (!options.force) {
            console.error('Send blocked. Use --force to skip preview.');
            process.exit(1);
          }
        }
      }

      // Create payload (minified by default to maximize usable payload space)
      const payload = createPayload(content, { minify: !options.noMinify });

      // Send
      const result = await sendToWebhook(payload, {
        plugin: options.plugin,
        webhookUrl: options.webhook,
        skipValidation: options.skipValidation,
        skipLog: options.skipLog,
      });

      // Output
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        if (result.success) {
          console.log(`✓ Sent to TRMNL (${result.pluginName})`);
          console.log(`  Status: ${result.statusCode}`);
          console.log(`  Time: ${result.durationMs}ms`);
          console.log(`  Size: ${result.validation.size_bytes} bytes (${result.validation.percent_used}% of limit)`);
        } else {
          console.error('✗ Failed to send');
          console.error(`  Error: ${result.error}`);
          if (result.pluginName) {
            console.error(`  Plugin: ${result.pluginName}`);
          }
          console.log('');
          console.log('Validation:');
          console.log(formatValidation(result.validation));
        }
      }

      process.exit(result.success ? 0 : 1);
    });
}

