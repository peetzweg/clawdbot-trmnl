/**
 * trmnl history - View send history
 */

import { unlinkSync } from 'node:fs';
import type { CAC } from 'cac';
import { formatEntry, getHistory, getHistoryPath, getHistoryStats, type HistoryFilter } from '../lib/logger.ts';

interface HistoryOptions {
  last?: number;
  today?: boolean;
  failed?: boolean;
  success?: boolean;
  plugin?: string;
  json?: boolean;
  verbose?: boolean;
}

export function registerHistoryCommand(cli: CAC): void {
  cli
    .command('history', 'View send history')
    .option('-n, --last <n>', 'Show last N entries', { default: 10 })
    .option('--today', 'Show only today\'s entries')
    .option('--failed', 'Show only failed sends')
    .option('--success', 'Show only successful sends')
    .option('-p, --plugin <name>', 'Filter by plugin name')
    .option('--json', 'Output as JSON')
    .option('-v, --verbose', 'Show content preview')
    .example('trmnl history')
    .example('trmnl history --last 20')
    .example('trmnl history --today --failed')
    .example('trmnl history --plugin office')
    .action((options: HistoryOptions) => {
      const filter: HistoryFilter = {
        last: options.last,
        today: options.today,
        failed: options.failed,
        success: options.success,
        plugin: options.plugin,
      };

      const entries = getHistory(filter);

      if (options.json) {
        console.log(JSON.stringify(entries, null, 2));
        return;
      }

      if (entries.length === 0) {
        console.log('No history entries found.');
        console.log(`History file: ${getHistoryPath()}`);
        return;
      }

      // Stats header
      const stats = getHistoryStats();
      if (stats) {
        console.log(`History: ${stats.entries} total entries (${stats.sizeMb} MB)`);
        console.log('');
      }

      // Filter description
      const filterParts: string[] = [];
      if (options.today) filterParts.push('today');
      if (options.failed) filterParts.push('failed');
      if (options.success) filterParts.push('success');
      if (options.plugin) filterParts.push(`plugin: ${options.plugin}`);
      if (filterParts.length > 0) {
        console.log(`Filter: ${filterParts.join(', ')}`);
        console.log('');
      }

      // Entries
      console.log(`Showing ${entries.length} entries (most recent first):`);
      console.log('');

      for (const entry of entries) {
        console.log(formatEntry(entry, options.verbose));
      }
    });

  // History clear
  cli
    .command('history clear', 'Clear send history')
    .option('--confirm', 'Confirm deletion')
    .action((options: { confirm?: boolean }) => {
      const historyPath = getHistoryPath();
      
      if (!options.confirm) {
        console.log('This will delete all history. Use --confirm to proceed.');
        console.log(`History file: ${historyPath}`);
        return;
      }

      try {
        unlinkSync(historyPath);
        console.log('✓ History cleared');
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
          console.log('History file does not exist.');
        } else {
          console.error('Error clearing history:', err);
        }
      }
    });

  // History stats
  cli
    .command('history stats', 'Show history statistics')
    .action(() => {
      const stats = getHistoryStats();
      
      if (!stats) {
        console.log('No history file found.');
        return;
      }

      const entries = getHistory({});
      const successCount = entries.filter(e => e.success).length;
      const failedCount = entries.filter(e => !e.success).length;
      const totalBytes = entries.reduce((sum, e) => sum + e.size_bytes, 0);
      const avgBytes = entries.length > 0 ? Math.round(totalBytes / entries.length) : 0;
      const avgDuration = entries.length > 0 
        ? Math.round(entries.reduce((sum, e) => sum + e.duration_ms, 0) / entries.length) 
        : 0;

      // Plugin breakdown
      const byPlugin = new Map<string, number>();
      for (const entry of entries) {
        byPlugin.set(entry.plugin, (byPlugin.get(entry.plugin) || 0) + 1);
      }

      console.log('History Statistics');
      console.log('');
      console.log(`File:     ${getHistoryPath()}`);
      console.log(`Size:     ${stats.sizeMb} MB`);
      console.log('');
      console.log(`Total:    ${entries.length} sends`);
      console.log(`Success:  ${successCount} (${entries.length > 0 ? Math.round(successCount / entries.length * 100) : 0}%)`);
      console.log(`Failed:   ${failedCount} (${entries.length > 0 ? Math.round(failedCount / entries.length * 100) : 0}%)`);
      console.log('');
      console.log(`Avg size:     ${avgBytes} bytes`);
      console.log(`Avg duration: ${avgDuration}ms`);

      if (byPlugin.size > 1) {
        console.log('');
        console.log('By plugin:');
        for (const [plugin, count] of byPlugin.entries()) {
          console.log(`  ${plugin}: ${count} sends`);
        }
      }

      // Recent activity
      const today = getHistory({ today: true });
      const thisWeek = getHistory({ since: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) });
      console.log('');
      console.log(`Today:     ${today.length} sends`);
      console.log(`This week: ${thisWeek.length} sends`);
    });
}
