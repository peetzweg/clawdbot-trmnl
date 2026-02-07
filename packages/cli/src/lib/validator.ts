/**
 * Payload validation for TRMNL webhooks
 */

import { TIER_LIMITS, type ValidationResult, type WebhookPayload, type WebhookTier } from '../types.ts';

/**
 * Validate a webhook payload against size limits
 */
export function validatePayload(payload: WebhookPayload, tier: WebhookTier = 'free'): ValidationResult {
  const jsonString = JSON.stringify(payload);
  const sizeBytes = new TextEncoder().encode(jsonString).length;
  const limitBytes = TIER_LIMITS[tier];
  const remainingBytes = limitBytes - sizeBytes;
  const percentUsed = Math.round((sizeBytes / limitBytes) * 1000) / 10;

  const warnings: string[] = [];
  const errors: string[] = [];

  // Size check
  if (sizeBytes > limitBytes) {
    errors.push(`Payload exceeds ${tier} tier limit: ${sizeBytes} bytes > ${limitBytes} bytes`);
  } else if (percentUsed > 90) {
    warnings.push(`Payload is at ${percentUsed}% of ${tier} tier limit`);
  }

  // Content check
  if (!payload.merge_variables) {
    errors.push('Missing merge_variables object');
  } else if (!payload.merge_variables.content && !payload.merge_variables.text) {
    warnings.push('No content or text field in merge_variables');
  }

  // HTML sanity checks
  const content = payload.merge_variables?.content || '';
  if (content) {
    // Check for unclosed tags (basic check)
    const openDivs = (content.match(/<div/g) || []).length;
    const closeDivs = (content.match(/<\/div>/g) || []).length;
    if (openDivs !== closeDivs) {
      warnings.push(`Potential unclosed divs: ${openDivs} open, ${closeDivs} close`);
    }

    // Check for common TRMNL patterns - look for 'layout' as a class (may have other classes too)
    const hasLayoutClass = /class=["'][^"']*\blayout\b[^"']*["']/.test(content);
    if (!hasLayoutClass) {
      warnings.push('Missing .layout class - TRMNL requires a root layout element');
    }
  }

  return {
    valid: errors.length === 0,
    size_bytes: sizeBytes,
    tier,
    limit_bytes: limitBytes,
    remaining_bytes: remainingBytes,
    percent_used: percentUsed,
    warnings,
    errors,
  };
}

/**
 * Parse content into a webhook payload
 */
export function createPayload(content: string): WebhookPayload {
  // Try to parse as JSON first
  try {
    const parsed = JSON.parse(content);
    if (parsed.merge_variables) {
      return parsed as WebhookPayload;
    }
    // If it's just merge_variables content
    return { merge_variables: parsed };
  } catch {
    // Treat as raw HTML content
    return {
      merge_variables: {
        content: content,
      },
    };
  }
}

/**
 * Format validation result for display
 */
export function formatValidation(result: ValidationResult): string {
  const lines: string[] = [];
  
  const status = result.valid ? '✓' : '✗';
  const sizeKb = (result.size_bytes / 1024).toFixed(2);
  const limitKb = (result.limit_bytes / 1024).toFixed(2);
  
  lines.push(`${status} Payload: ${result.size_bytes} bytes (${sizeKb} KB)`);
  lines.push(`  Tier: ${result.tier} (limit: ${limitKb} KB)`);
  lines.push(`  Used: ${result.percent_used}% (${result.remaining_bytes} bytes remaining)`);
  
  if (result.errors.length > 0) {
    lines.push('');
    lines.push('Errors:');
    for (const error of result.errors) {
      lines.push(`  ✗ ${error}`);
    }
  }
  
  if (result.warnings.length > 0) {
    lines.push('');
    lines.push('Warnings:');
    for (const warning of result.warnings) {
      lines.push(`  ⚠ ${warning}`);
    }
  }
  
  return lines.join('\n');
}
