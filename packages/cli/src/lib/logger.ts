/**
 * JSONL history logger for tracking sent payloads
 */

import { appendFileSync, existsSync, readFileSync, statSync } from 'node:fs';
import { ensureConfigDir, getHistoryConfig } from './config.ts';
import type { HistoryEntry } from '../types.ts';

/**
 * Append a history entry to the JSONL file
 */
export function logEntry(entry: HistoryEntry): void {
  ensureConfigDir();
  const { path } = getHistoryConfig();
  const line = JSON.stringify(entry) + '\n';
  appendFileSync(path, line, 'utf-8');
}

/**
 * Read all history entries
 */
export function readHistory(): HistoryEntry[] {
  const { path } = getHistoryConfig();
  
  if (!existsSync(path)) {
    return [];
  }

  try {
    const content = readFileSync(path, 'utf-8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.map(line => JSON.parse(line) as HistoryEntry);
  } catch {
    return [];
  }
}

/**
 * Get history entries with filters
 */
export interface HistoryFilter {
  last?: number;
  today?: boolean;
  failed?: boolean;
  success?: boolean;
  plugin?: string;
  since?: Date;
  until?: Date;
}

export function getHistory(filter: HistoryFilter = {}): HistoryEntry[] {
  let entries = readHistory();

  // Filter by plugin
  if (filter.plugin) {
    entries = entries.filter(e => e.plugin === filter.plugin);
  }

  // Filter by success/failed
  if (filter.failed) {
    entries = entries.filter(e => !e.success);
  }
  if (filter.success) {
    entries = entries.filter(e => e.success);
  }

  // Filter by date
  if (filter.today) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    entries = entries.filter(e => new Date(e.timestamp) >= today);
  }
  if (filter.since) {
    entries = entries.filter(e => new Date(e.timestamp) >= filter.since!);
  }
  if (filter.until) {
    entries = entries.filter(e => new Date(e.timestamp) <= filter.until!);
  }

  // Sort by timestamp descending (most recent first)
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Limit results
  if (filter.last) {
    entries = entries.slice(0, filter.last);
  }

  return entries;
}

/**
 * Format a history entry for display
 */
export function formatEntry(entry: HistoryEntry, verbose = false): string {
  const time = new Date(entry.timestamp).toLocaleString();
  const status = entry.success ? '✓' : '✗';
  const sizeKb = (entry.size_bytes / 1024).toFixed(2);
  
  let line = `${status} ${time} | ${entry.plugin} | ${sizeKb} KB | ${entry.duration_ms}ms`;
  
  if (!entry.success && entry.error) {
    line += ` | ${entry.error}`;
  }
  
  if (verbose && entry.payload?.merge_variables?.content) {
    const preview = entry.payload.merge_variables.content.substring(0, 80);
    line += `\n   ${preview}${entry.payload.merge_variables.content.length > 80 ? '...' : ''}`;
  }
  
  return line;
}

/**
 * Get history file stats
 */
export function getHistoryStats(): { entries: number; sizeBytes: number; sizeMb: number } | null {
  const { path } = getHistoryConfig();
  
  if (!existsSync(path)) {
    return null;
  }

  try {
    const stats = statSync(path);
    const entries = readHistory().length;
    return {
      entries,
      sizeBytes: stats.size,
      sizeMb: Math.round((stats.size / 1024 / 1024) * 100) / 100,
    };
  } catch {
    return null;
  }
}

/**
 * Get history file path
 */
export function getHistoryPath(): string {
  return getHistoryConfig().path;
}
