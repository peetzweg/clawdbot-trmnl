/**
 * Config file management for ~/.trmnl/config.json
 * Supports multiple plugins with a default
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { Config, Plugin, WebhookTier } from '../types.ts';
import { DEFAULT_CONFIG } from '../types.ts';

/** Config directory path */
export const CONFIG_DIR = join(homedir(), '.trmnl');

/** Config file path (now JSON) */
export const CONFIG_PATH = join(CONFIG_DIR, 'config.json');

/** Legacy TOML config path (for migration) */
const LEGACY_CONFIG_PATH = join(CONFIG_DIR, 'config.toml');

/** History file path */
export const HISTORY_PATH = join(CONFIG_DIR, 'history.jsonl');

/**
 * Ensure ~/.trmnl directory exists
 */
export function ensureConfigDir(): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Migrate legacy TOML config to JSON (one-time)
 */
function migrateLegacyConfig(): Config | null {
  if (!existsSync(LEGACY_CONFIG_PATH)) {
    return null;
  }

  try {
    const content = readFileSync(LEGACY_CONFIG_PATH, 'utf-8');
    const config: Config = { plugins: {} };

    // Parse legacy TOML (simple parser for our format)
    let webhookUrl: string | undefined;
    let tier: WebhookTier = 'free';

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      const urlMatch = trimmed.match(/^url\s*=\s*"([^"]+)"/);
      if (urlMatch) webhookUrl = urlMatch[1];
      const tierMatch = trimmed.match(/^tier\s*=\s*"([^"]+)"/);
      if (tierMatch) tier = tierMatch[1] as WebhookTier;
    }

    if (webhookUrl) {
      config.plugins['default'] = { url: webhookUrl, tier };
      config.defaultPlugin = 'default';
    }

    // Remove legacy file after migration
    unlinkSync(LEGACY_CONFIG_PATH);
    console.log('Migrated legacy config.toml to config.json');

    return config;
  } catch {
    return null;
  }
}

/**
 * Load config from file
 */
export function loadConfig(): Config {
  ensureConfigDir();

  // Try to migrate legacy config first
  const migrated = migrateLegacyConfig();
  if (migrated) {
    saveConfig(migrated);
    return migrated;
  }

  if (!existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG };
  }

  try {
    const content = readFileSync(CONFIG_PATH, 'utf-8');
    const parsed = JSON.parse(content) as Partial<Config>;
    return {
      plugins: parsed.plugins || {},
      defaultPlugin: parsed.defaultPlugin,
      history: parsed.history || DEFAULT_CONFIG.history,
    };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

/**
 * Save config to file
 */
export function saveConfig(config: Config): void {
  ensureConfigDir();
  const content = JSON.stringify(config, null, 2);
  writeFileSync(CONFIG_PATH, content, 'utf-8');
}

/**
 * Get a plugin by name (or default if not specified)
 */
export function getPlugin(name?: string): { name: string; plugin: Plugin } | null {
  const config = loadConfig();
  
  // If name specified, use that
  if (name) {
    const plugin = config.plugins[name];
    if (plugin) {
      return { name, plugin };
    }
    return null;
  }

  // Use default plugin
  const defaultName = config.defaultPlugin;
  if (defaultName && config.plugins[defaultName]) {
    return { name: defaultName, plugin: config.plugins[defaultName] };
  }

  // If only one plugin, use it
  const pluginNames = Object.keys(config.plugins);
  if (pluginNames.length === 1) {
    const name = pluginNames[0];
    return { name, plugin: config.plugins[name] };
  }

  return null;
}

/**
 * Add or update a plugin
 */
export function setPlugin(name: string, url: string, tier: WebhookTier = 'free', description?: string): void {
  const config = loadConfig();
  config.plugins[name] = { url, tier, description };
  
  // If no default and this is the first plugin, make it default
  if (!config.defaultPlugin || Object.keys(config.plugins).length === 1) {
    config.defaultPlugin = name;
  }
  
  saveConfig(config);
}

/**
 * Remove a plugin
 */
export function removePlugin(name: string): boolean {
  const config = loadConfig();
  
  if (!config.plugins[name]) {
    return false;
  }
  
  delete config.plugins[name];
  
  // If we removed the default, pick a new one
  if (config.defaultPlugin === name) {
    const remaining = Object.keys(config.plugins);
    config.defaultPlugin = remaining.length > 0 ? remaining[0] : undefined;
  }
  
  saveConfig(config);
  return true;
}

/**
 * Set the default plugin
 */
export function setDefaultPlugin(name: string): boolean {
  const config = loadConfig();
  
  if (!config.plugins[name]) {
    return false;
  }
  
  config.defaultPlugin = name;
  saveConfig(config);
  return true;
}

/**
 * List all plugins
 */
export function listPlugins(): Array<{ name: string; plugin: Plugin; isDefault: boolean }> {
  const config = loadConfig();
  return Object.entries(config.plugins).map(([name, plugin]) => ({
    name,
    plugin,
    isDefault: name === config.defaultPlugin,
  }));
}

/**
 * Get webhook URL from environment, plugin name, or default
 */
export function getWebhookUrl(pluginName?: string): { url: string; name: string; tier: WebhookTier } | null {
  // Environment variable takes highest precedence
  const envUrl = process.env.TRMNL_WEBHOOK;
  if (envUrl) {
    return { url: envUrl, name: '$TRMNL_WEBHOOK', tier: 'free' };
  }

  // Try to get plugin
  const result = getPlugin(pluginName);
  if (result) {
    return {
      url: result.plugin.url,
      name: result.name,
      tier: result.plugin.tier || 'free',
    };
  }

  return null;
}

/**
 * Get history config
 */
export function getHistoryConfig(): { path: string; maxSizeMb: number } {
  const config = loadConfig();
  const historyPath = config.history?.path || DEFAULT_CONFIG.history!.path!;
  const expandedPath = historyPath.startsWith('~') 
    ? historyPath.replace('~', homedir())
    : historyPath;
  
  return {
    path: expandedPath,
    maxSizeMb: config.history?.maxSizeMb || DEFAULT_CONFIG.history!.maxSizeMb!,
  };
}
