/**
 * trmnl send - Send content to TRMNL display
 */

import { readFileSync } from 'node:fs';
import type { CAC } from 'cac';
import { createPayload, formatValidation } from '../lib/validator.ts';
import { sendToWebhook } from '../lib/webhook.ts';

interface SendOptions {
  content?: string;
  file?: string;
  plugin?: string;
  webhook?: string;
  skipValidation?: boolean;
  skipLog?: boolean;
  json?: boolean;
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

      // Create payload
      const payload = createPayload(content);

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

/**
 * Read content from stdin (non-blocking check)
 */
async function readStdin(): Promise<string> {
  // Check if stdin has data (not a TTY)
  if (process.stdin.isTTY) {
    return '';
  }

  const chunks: Buffer[] = [];
  
  return new Promise((resolve) => {
    process.stdin.on('data', (chunk) => chunks.push(chunk));
    process.stdin.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8').trim()));
    process.stdin.on('error', () => resolve(''));
    
    // Timeout to avoid hanging
    setTimeout(() => {
      if (chunks.length === 0) {
        resolve('');
      }
    }, 100);
  });
}
