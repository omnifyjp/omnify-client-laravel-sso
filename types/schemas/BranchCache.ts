/**
 * BranchCache Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types/schemas here.
 * This file will NOT be overwritten by the generator.
 */

import { z } from 'zod';
import type { BranchCache as BranchCacheBase } from '@omnify-base/schemas/BranchCache';
import {
  baseBranchCacheSchemas,
  baseBranchCacheCreateSchema,
  baseBranchCacheUpdateSchema,
  branchCacheI18n,
  getBranchCacheLabel,
  getBranchCacheFieldLabel,
  getBranchCacheFieldPlaceholder,
} from '@omnify-base/schemas/BranchCache';

// ============================================================================
// Types (extend or re-export)
// ============================================================================

export interface BranchCache extends BranchCacheBase {
  // Add custom properties here
}

// ============================================================================
// Schemas (extend or re-export)
// ============================================================================

export const branchCacheSchemas = { ...baseBranchCacheSchemas };
export const branchCacheCreateSchema = baseBranchCacheCreateSchema;
export const branchCacheUpdateSchema = baseBranchCacheUpdateSchema;

// ============================================================================
// Types
// ============================================================================

export type BranchCacheCreate = z.infer<typeof branchCacheCreateSchema>;
export type BranchCacheUpdate = z.infer<typeof branchCacheUpdateSchema>;

// Re-export i18n and helpers
export {
  branchCacheI18n,
  getBranchCacheLabel,
  getBranchCacheFieldLabel,
  getBranchCacheFieldPlaceholder,
};

// Re-export base type for internal use
export type { BranchCacheBase };
