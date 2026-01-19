/**
 * TeamPermission Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types/schemas here.
 * This file will NOT be overwritten by the generator.
 */

import { z } from 'zod';
import type { TeamPermission as TeamPermissionBase } from '@omnify-base/schemas/TeamPermission';
import {
  baseTeamPermissionSchemas,
  baseTeamPermissionCreateSchema,
  baseTeamPermissionUpdateSchema,
  teamPermissionI18n,
  getTeamPermissionLabel,
  getTeamPermissionFieldLabel,
  getTeamPermissionFieldPlaceholder,
} from '@omnify-base/schemas/TeamPermission';

// ============================================================================
// Types (extend or re-export)
// ============================================================================

export interface TeamPermission extends TeamPermissionBase {
  // Add custom properties here
}

// ============================================================================
// Schemas (extend or re-export)
// ============================================================================

export const teamPermissionSchemas = { ...baseTeamPermissionSchemas };
export const teamPermissionCreateSchema = baseTeamPermissionCreateSchema;
export const teamPermissionUpdateSchema = baseTeamPermissionUpdateSchema;

// ============================================================================
// Types
// ============================================================================

export type TeamPermissionCreate = z.infer<typeof teamPermissionCreateSchema>;
export type TeamPermissionUpdate = z.infer<typeof teamPermissionUpdateSchema>;

// Re-export i18n and helpers
export {
  teamPermissionI18n,
  getTeamPermissionLabel,
  getTeamPermissionFieldLabel,
  getTeamPermissionFieldPlaceholder,
};

// Re-export base type for internal use
export type { TeamPermissionBase };
