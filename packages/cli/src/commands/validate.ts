/**
 * trmnl validate - Validate payload without sending
 */

import { readFileSync } from 'node:fs';
import type { CAC } from 'cac';
import { getTier } from '../lib/config.ts';
import { createPayload, formatValidation, validatePayload } from '../lib/validator.ts';
import type { WebhookTier } from '../types.ts';

interface ValidateOptions {
  content?: string;
  file?: string;
  tier?: WebhookTier;
  noMinify?: boolean;
  json?: boolean;
}

export function registerValidateCommand(cli: CAC): void {
  cli
    .command('validate', 'Validate payload without sending')
    .option('-c, --content <html>', 'HTML content to validate')
    .option('-f, --file <path>', 'Read content from file')
    .option('-t, --tier <tier>', 'Override tier (free or plus)')
    .option('--no-minify', 'Disable HTML minification (enabled by default)')
    .option('--json', 'Output result as JSON')
    .example('trmnl validate --file ./output.html')
    .example('trmnl validate --content "<div>...</div>" --tier plus')
    .action(async (options: ValidateOptions) => {
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

      // Use explicit tier or global config
      const tier = options.tier || getTier();

      // Create payload (minified by default to maximize usable payload space)
      const payload = createPayload(content, { minify: !options.noMinify });
      const result = validatePayload(payload, tier);

      // Output
      if (options.json) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatValidation(result));
      }

      process.exit(result.valid ? 0 : 1);
    });
}

/**
 * Read content from stdin (non-blocking check)
 */
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
