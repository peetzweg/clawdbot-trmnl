/**
 * Webhook sending logic
 */

import { getWebhookUrl } from './config.ts';
import { logEntry } from './logger.ts';
import { validatePayload } from './validator.ts';
import type { HistoryEntry, WebhookPayload, WebhookTier } from '../types.ts';

export interface SendResult {
  success: boolean;
  pluginName: string;
  statusCode?: number;
  response?: string;
  error?: string;
  durationMs: number;
  validation: ReturnType<typeof validatePayload>;
}

export interface SendOptions {
  plugin?: string;        // Plugin name to use
  webhookUrl?: string;    // Direct URL override
  tier?: WebhookTier;     // Tier override
  skipValidation?: boolean;
  skipLog?: boolean;
}

/**
 * Send payload to TRMNL webhook
 */
export async function sendToWebhook(
  payload: WebhookPayload,
  options: SendOptions = {}
): Promise<SendResult> {
  const startTime = Date.now();
  
  // Resolve webhook URL and tier
  let webhookUrl: string;
  let pluginName: string;
  let tier: WebhookTier;

  if (options.webhookUrl) {
    // Direct URL override
    webhookUrl = options.webhookUrl;
    pluginName = 'custom';
    tier = options.tier || 'free';
  } else {
    // Get from config/env
    const resolved = getWebhookUrl(options.plugin);
    if (!resolved) {
      const durationMs = Date.now() - startTime;
      const validation = validatePayload(payload, 'free');
      
      let error = 'No webhook URL configured.';
      if (options.plugin) {
        error = `Plugin "${options.plugin}" not found.`;
      } else {
        error += ' Add a plugin with: trmnl plugin add <name> <url>';
      }
      
      return {
        success: false,
        pluginName: options.plugin || 'unknown',
        error,
        durationMs,
        validation,
      };
    }
    webhookUrl = resolved.url;
    pluginName = resolved.name;
    tier = options.tier || resolved.tier;
  }

  // Validate payload
  const validation = validatePayload(payload, tier);
  
  if (!options.skipValidation && !validation.valid) {
    const durationMs = Date.now() - startTime;
    const result: SendResult = {
      success: false,
      pluginName,
      error: validation.errors.join('; '),
      durationMs,
      validation,
    };
    
    // Log failed validation
    if (!options.skipLog) {
      logEntry(createHistoryEntry(payload, result, tier, pluginName));
    }
    
    return result;
  }
  
  // Send request
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    
    const durationMs = Date.now() - startTime;
    const responseText = await response.text();
    
    const result: SendResult = {
      success: response.ok,
      pluginName,
      statusCode: response.status,
      response: responseText,
      durationMs,
      validation,
    };
    
    if (!response.ok) {
      result.error = `HTTP ${response.status}: ${responseText}`;
    }
    
    // Log the send
    if (!options.skipLog) {
      logEntry(createHistoryEntry(payload, result, tier, pluginName));
    }
    
    return result;
    
  } catch (err) {
    const durationMs = Date.now() - startTime;
    const error = err instanceof Error ? err.message : 'Unknown error';
    
    const result: SendResult = {
      success: false,
      pluginName,
      error,
      durationMs,
      validation,
    };
    
    // Log the error
    if (!options.skipLog) {
      logEntry(createHistoryEntry(payload, result, tier, pluginName));
    }
    
    return result;
  }
}

/**
 * Create a history entry from send result
 */
function createHistoryEntry(
  payload: WebhookPayload,
  result: SendResult,
  tier: WebhookTier,
  pluginName: string
): HistoryEntry {
  return {
    timestamp: new Date().toISOString(),
    plugin: pluginName,
    size_bytes: result.validation.size_bytes,
    tier,
    payload,
    success: result.success,
    status_code: result.statusCode,
    response: result.response,
    error: result.error,
    duration_ms: result.durationMs,
  };
}
