/**
 * OrganizationCache Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types/schemas here.
 * This file will NOT be overwritten by the generator.
 */

import { z } from 'zod';
import type { OrganizationCache as OrganizationCacheBase } from '@omnify-base/schemas/OrganizationCache';
import {
  baseOrganizationCacheSchemas,
  baseOrganizationCacheCreateSchema,
  baseOrganizationCacheUpdateSchema,
  organizationCacheI18n,
  getOrganizationCacheLabel,
  getOrganizationCacheFieldLabel,
  getOrganizationCacheFieldPlaceholder,
} from '@omnify-base/schemas/OrganizationCache';

// ============================================================================
// Types (extend or re-export)
// ============================================================================

export interface OrganizationCache extends OrganizationCacheBase {
  // Add custom properties here
}

// ============================================================================
// Schemas (extend or re-export)
// ============================================================================

export const organizationCacheSchemas = { ...baseOrganizationCacheSchemas };
export const organizationCacheCreateSchema = baseOrganizationCacheCreateSchema;
export const organizationCacheUpdateSchema = baseOrganizationCacheUpdateSchema;

// ============================================================================
// Types
// ============================================================================

export type OrganizationCacheCreate = z.infer<typeof organizationCacheCreateSchema>;
export type OrganizationCacheUpdate = z.infer<typeof organizationCacheUpdateSchema>;

// Re-export i18n and helpers
export {
  organizationCacheI18n,
  getOrganizationCacheLabel,
  getOrganizationCacheFieldLabel,
  getOrganizationCacheFieldPlaceholder,
};

// Re-export base type for internal use
export type { OrganizationCacheBase };
