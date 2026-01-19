/**
 * Team Model
 *
 * This file extends the auto-generated base interface.
 * You can add custom methods, computed properties, or override types/schemas here.
 * This file will NOT be overwritten by the generator.
 */

import { z } from 'zod';
import type { Team as TeamBase } from '@omnify-base/schemas/Team';
import {
  baseTeamSchemas,
  baseTeamCreateSchema,
  baseTeamUpdateSchema,
  teamI18n,
  getTeamLabel,
  getTeamFieldLabel,
  getTeamFieldPlaceholder,
} from '@omnify-base/schemas/Team';

// ============================================================================
// Types (extend or re-export)
// ============================================================================

export interface Team extends TeamBase {
  // Add custom properties here
}

// ============================================================================
// Schemas (extend or re-export)
// ============================================================================

export const teamSchemas = { ...baseTeamSchemas };
export const teamCreateSchema = baseTeamCreateSchema;
export const teamUpdateSchema = baseTeamUpdateSchema;

// ============================================================================
// Types
// ============================================================================

export type TeamCreate = z.infer<typeof teamCreateSchema>;
export type TeamUpdate = z.infer<typeof teamUpdateSchema>;

// Re-export i18n and helpers
export {
  teamI18n,
  getTeamLabel,
  getTeamFieldLabel,
  getTeamFieldPlaceholder,
};

// Re-export base type for internal use
export type { TeamBase };
