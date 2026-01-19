import { OmnifyPlugin } from '@famgia/omnify-types';

/**
 * @famgia/omnify-laravel - Plugin
 *
 * Plugin for generating Laravel migration files and Eloquent models from Omnify schemas.
 *
 * @example Basic usage (Laravel at project root)
 * ```typescript
 * import { defineConfig } from '@famgia/omnify';
 * import laravel from '@famgia/omnify-laravel/plugin';
 *
 * export default defineConfig({
 *   plugins: [laravel()],  // Uses all defaults
 * });
 * ```
 *
 * @example Monorepo (Laravel in ./backend/)
 * ```typescript
 * import { defineConfig } from '@famgia/omnify';
 * import laravel from '@famgia/omnify-laravel/plugin';
 *
 * export default defineConfig({
 *   plugins: [
 *     laravel({
 *       base: './backend/',  // All paths relative to this
 *       generateRequests: true,
 *       generateResources: true,
 *     }),
 *   ],
 * });
 * ```
 */

/**
 * Options for the Laravel plugin.
 */
interface LaravelPluginOptions {
    /**
     * Base directory for Laravel project (relative to project root).
     * All other paths will be relative to this base.
     *
     * @default '' (project root)
     * @example './backend/' for monorepo with Laravel in backend folder
     */
    base?: string;
    /**
     * Path for Laravel migration files (relative to base).
     * @default 'database/migrations/omnify'
     */
    migrationsPath?: string;
    /**
     * Path for user-editable model files (relative to base).
     * @default 'app/Models'
     */
    modelsPath?: string;
    /**
     * Path for auto-generated base model files (relative to base).
     * @default 'app/Models/OmnifyBase'
     */
    baseModelsPath?: string;
    /**
     * Path for Laravel service provider files (relative to base).
     * @default 'app/Providers'
     */
    providersPath?: string;
    /**
     * Model namespace.
     * @default 'App\\Models'
     */
    modelNamespace?: string;
    /**
     * Base model namespace.
     * @default 'App\\Models\\OmnifyBase'
     */
    baseModelNamespace?: string;
    /**
     * Whether to generate Eloquent models.
     * @default true
     */
    generateModels?: boolean;
    /**
     * Path for Laravel factory files.
     * @default 'database/factories'
     */
    factoriesPath?: string;
    /**
     * Whether to generate Laravel factories.
     * @default true
     */
    generateFactories?: boolean;
    /**
     * Faker locale for factory data.
     * @default 'en_US'
     */
    fakerLocale?: string;
    /**
     * Database connection name for migrations.
     */
    connection?: string;
    /**
     * Custom timestamp for migration file names (mainly for testing).
     */
    timestamp?: string;
    /**
     * Path for user-editable FormRequest files.
     * @default 'app/Http/Requests'
     */
    requestsPath?: string;
    /**
     * Path for auto-generated base FormRequest files.
     * @default 'app/Http/Requests/OmnifyBase'
     */
    baseRequestsPath?: string;
    /**
     * Request namespace.
     * @default 'App\\Http\\Requests'
     */
    requestNamespace?: string;
    /**
     * Base request namespace.
     * @default 'App\\Http\\Requests\\OmnifyBase'
     */
    baseRequestNamespace?: string;
    /**
     * Whether to generate Laravel FormRequest classes.
     * @default true
     */
    generateRequests?: boolean;
    /**
     * Path for user-editable API Resource files.
     * @default 'app/Http/Resources'
     */
    resourcesPath?: string;
    /**
     * Path for auto-generated base API Resource files.
     * @default 'app/Http/Resources/OmnifyBase'
     */
    baseResourcesPath?: string;
    /**
     * Resource namespace.
     * @default 'App\\Http\\Resources'
     */
    resourceNamespace?: string;
    /**
     * Base resource namespace.
     * @default 'App\\Http\\Resources\\OmnifyBase'
     */
    baseResourceNamespace?: string;
    /**
     * Whether to generate Laravel API Resource classes.
     * @default true
     */
    generateResources?: boolean;
}
/**
 * Creates the Laravel plugin with the specified options.
 *
 * @param options - Plugin configuration options
 * @returns OmnifyPlugin configured for Laravel migrations and models
 */
declare function laravelPlugin(options?: LaravelPluginOptions): OmnifyPlugin;

export { type LaravelPluginOptions, laravelPlugin as default, laravelPlugin };
