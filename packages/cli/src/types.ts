/**
 * TRMNL CLI Types
 */

/** Webhook tier determines payload size limits */
export type WebhookTier = 'free' | 'plus';

/** Size limits per tier in bytes */
export const TIER_LIMITS: Record<WebhookTier, number> = {
  free: 2048,   // 2 KB
  plus: 5120,   // 5 KB
};

/** Plugin configuration */
export interface Plugin {
  url: string;
  tier?: WebhookTier;
  description?: string;
}

/** CLI configuration stored in ~/.trmnl/config.json */
export interface Config {
  plugins: Record<string, Plugin>;
  defaultPlugin?: string;
  history?: {
    path?: string;
    maxSizeMb?: number;
  };
}

/** Default config values */
export const DEFAULT_CONFIG: Config = {
  plugins: {},
  defaultPlugin: undefined,
  history: {
    path: '~/.trmnl/history.jsonl',
    maxSizeMb: 100,
  },
};

/** Merge variables payload structure */
export interface MergeVariables {
  content?: string;
  title?: string;
  text?: string;
  image?: string;
  [key: string]: string | undefined;
}

/** Webhook request payload */
export interface WebhookPayload {
  merge_variables: MergeVariables;
}

/** History entry stored in JSONL */
export interface HistoryEntry {
  timestamp: string;
  plugin: string;
  size_bytes: number;
  tier: WebhookTier;
  payload: WebhookPayload;
  success: boolean;
  status_code?: number;
  response?: string;
  error?: string;
  duration_ms: number;
}

/** Validation result */
export interface ValidationResult {
  valid: boolean;
  size_bytes: number;
  tier: WebhookTier;
  limit_bytes: number;
  remaining_bytes: number;
  percent_used: number;
  warnings: string[];
  errors: string[];
}
