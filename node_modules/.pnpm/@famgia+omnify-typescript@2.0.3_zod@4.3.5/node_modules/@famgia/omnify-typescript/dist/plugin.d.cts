import { OmnifyPlugin } from '@famgia/omnify-types';

/**
 * @famgia/omnify-typescript - Plugin
 *
 * Plugin for generating TypeScript type definitions and Zod schemas from Omnify schemas.
 *
 * ## Usage
 *
 * ```typescript
 * import { defineConfig } from '@famgia/omnify';
 * import typescript from '@famgia/omnify-typescript/plugin';
 *
 * export default defineConfig({
 *   plugins: [
 *     typescript({
 *       modelsPath: 'resources/ts/omnify',
 *       generateZodSchemas: true,
 *     }),
 *   ],
 * });
 * ```
 *
 * ## With @famgia/omnify-react
 *
 * Use with `@famgia/omnify-react` runtime package for React utilities:
 *
 * ```typescript
 * import {
 *   JapaneseNameField,
 *   JapaneseAddressField,
 *   useFormMutation,
 *   zodRule,
 * } from '@famgia/omnify-react';
 * ```
 */

/**
 * Default paths
 */
declare const DEFAULTS: {
    modelsPath: string;
};
/**
 * Options for the TypeScript plugin.
 */
interface TypeScriptPluginOptions {
    /**
     * Path for TypeScript model files.
     *
     * @default 'resources/ts/omnify'
     */
    modelsPath?: string;
    /**
     * Generate Zod schemas alongside TypeScript types.
     * @default true
     */
    generateZodSchemas?: boolean;
}
/**
 * Creates the TypeScript plugin with the specified options.
 *
 * @param options - Plugin configuration options
 * @returns OmnifyPlugin configured for TypeScript generation
 */
declare function typescriptPlugin(options?: TypeScriptPluginOptions): OmnifyPlugin;

declare const MODERN_DEFAULTS: {
    modelsPath: string;
};
declare const LEGACY_DEFAULTS: {
    modelsPath: string;
};
/**
 * Create TypeScript plugin with default settings.
 *
 * @example
 * ```typescript
 * import { typescriptModern } from '@famgia/omnify-typescript/plugin';
 *
 * export default defineConfig({
 *   plugins: [typescriptModern()],
 * });
 * ```
 */
declare function typescriptModern(options?: TypeScriptPluginOptions): OmnifyPlugin;

export { DEFAULTS, LEGACY_DEFAULTS, MODERN_DEFAULTS, type TypeScriptPluginOptions, typescriptPlugin as default, typescriptModern, typescriptPlugin };
