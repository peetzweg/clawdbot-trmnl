/**
 * trmnl framework - Manage cached TRMNL CSS/JS framework
 */

import type { CAC } from 'cac';

export function registerFrameworkCommand(cli: CAC): void {
  const cmd = cli.command('framework [action]', 'Manage cached TRMNL framework (status|update|check)')
    .example('trmnl framework status')
    .example('trmnl framework update')
    .example('trmnl framework check')
    .action(async (action?: string) => {
      let renderer: typeof import('trmnl-renderer');
      try {
        renderer = await import('trmnl-renderer');
      } catch {
        console.error('trmnl-renderer package not found.');
        console.error('Run: pnpm add trmnl-renderer');
        process.exit(1);
      }

      switch (action) {
        case 'status': {
          const info = renderer.getFrameworkStatus();
          if (!info) {
            console.log('No framework cached. Run: trmnl framework update');
          } else {
            console.log(`TRMNL Framework (cached)`);
            console.log(`  Version: ${info.version}`);
            console.log(`  Fetched: ${info.fetchedAt}`);
            console.log(`  CSS: ${info.cssPath} (${(info.size.css / 1024).toFixed(1)} KB)`);
            console.log(`  JS:  ${info.jsPath} (${(info.size.js / 1024).toFixed(1)} KB)`);
          }
          break;
        }

        case 'update': {
          console.log('Fetching TRMNL framework from CDN...');
          const result = await renderer.updateFramework();
          if (result.updated) {
            console.log(`\u2713 Framework updated: ${result.oldVersion ?? 'none'} \u2192 ${result.newVersion}`);
          } else {
            console.log(`\u2713 Framework up-to-date: ${result.newVersion}`);
          }
          break;
        }

        case 'check': {
          console.log('Checking for framework update...');
          const check = await renderer.checkForUpdate();
          if (check.available) {
            console.log(`Update available. Current: ${check.currentVersion ?? 'not cached'}`);
            console.log('Run: trmnl framework update');
          } else {
            console.log(`Up-to-date: ${check.currentVersion}`);
          }
          break;
        }

        default:
          console.log('Usage: trmnl framework <status|update|check>');
          console.log('');
          console.log('  status   Show cached framework info');
          console.log('  update   Fetch latest from CDN');
          console.log('  check    Check if update available');
          break;
      }
    });
}
