/**
 * UserCache Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types/schemas here.
 * This file will NOT be overwritten by the generator.
 */

import { z } from 'zod';
import type { UserCache as UserCacheBase } from '@omnify-base/schemas/UserCache';
import {
  baseUserCacheSchemas,
  baseUserCacheCreateSchema,
  baseUserCacheUpdateSchema,
  userCacheI18n,
  getUserCacheLabel,
  getUserCacheFieldLabel,
  getUserCacheFieldPlaceholder,
} from '@omnify-base/schemas/UserCache';

// ============================================================================
// Types (extend or re-export)
// ============================================================================

export interface UserCache extends UserCacheBase {
  // Add custom properties here
}

// ============================================================================
// Schemas (extend or re-export)
// ============================================================================

export const userCacheSchemas = { ...baseUserCacheSchemas };
export const userCacheCreateSchema = baseUserCacheCreateSchema;
export const userCacheUpdateSchema = baseUserCacheUpdateSchema;

// ============================================================================
// Types
// ============================================================================

export type UserCacheCreate = z.infer<typeof userCacheCreateSchema>;
export type UserCacheUpdate = z.infer<typeof userCacheUpdateSchema>;

// Re-export i18n and helpers
export {
  userCacheI18n,
  getUserCacheLabel,
  getUserCacheFieldLabel,
  getUserCacheFieldPlaceholder,
};

// Re-export base type for internal use
export type { UserCacheBase };
