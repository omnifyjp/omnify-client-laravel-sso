/**
 * TeamCache Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types/schemas here.
 * This file will NOT be overwritten by the generator.
 */

import { z } from 'zod';
import type { TeamCache as TeamCacheBase } from '@omnify-base/schemas/TeamCache';
import {
  baseTeamCacheSchemas,
  baseTeamCacheCreateSchema,
  baseTeamCacheUpdateSchema,
  teamCacheI18n,
  getTeamCacheLabel,
  getTeamCacheFieldLabel,
  getTeamCacheFieldPlaceholder,
} from '@omnify-base/schemas/TeamCache';

// ============================================================================
// Types (extend or re-export)
// ============================================================================

export interface TeamCache extends TeamCacheBase {
  // Add custom properties here
}

// ============================================================================
// Schemas (extend or re-export)
// ============================================================================

export const teamCacheSchemas = { ...baseTeamCacheSchemas };
export const teamCacheCreateSchema = baseTeamCacheCreateSchema;
export const teamCacheUpdateSchema = baseTeamCacheUpdateSchema;

// ============================================================================
// Types
// ============================================================================

export type TeamCacheCreate = z.infer<typeof teamCacheCreateSchema>;
export type TeamCacheUpdate = z.infer<typeof teamCacheUpdateSchema>;

// Re-export i18n and helpers
export {
  teamCacheI18n,
  getTeamCacheLabel,
  getTeamCacheFieldLabel,
  getTeamCacheFieldPlaceholder,
};

// Re-export base type for internal use
export type { TeamCacheBase };
