import { CustomTypeDefinition, PluginEnumDefinition, LocaleResolutionOptions, PropertyDefinition, SchemaCollection, LoadedSchema } from '@famgia/omnify-types';
import { SchemaChange } from '@famgia/omnify-atlas';
export { LaravelPluginOptions, laravelPlugin } from './plugin.js';

/**
 * @famgia/omnify-laravel - Migration Types
 *
 * Types for Laravel migration generation.
 */

/**
 * Laravel migration file structure.
 */
interface MigrationFile {
    /** File name with timestamp prefix */
    readonly fileName: string;
    /** Migration class name */
    readonly className: string;
    /** Full file content */
    readonly content: string;
    /** Tables affected */
    readonly tables: readonly string[];
    /** Whether this is a create or alter migration */
    readonly type: 'create' | 'alter' | 'drop';
    /**
     * Schema name (for routing to correct output path when packageOutput is set).
     * Undefined for pivot tables or system migrations.
     */
    readonly schemaName?: string | undefined;
}
/**
 * Migration generation options.
 */
interface MigrationOptions {
    /** Output directory for migrations */
    readonly outputDir?: string | undefined;
    /** Timestamp prefix (defaults to current time) */
    readonly timestamp?: string | undefined;
    /** Whether to generate down migration */
    readonly generateDown?: boolean | undefined;
    /** Database connection name */
    readonly connection?: string | undefined;
    /** Custom types from plugins (for compound type expansion) */
    readonly customTypes?: ReadonlyMap<string, CustomTypeDefinition> | undefined;
    /** Plugin enums from registry (for enumRef resolution) */
    readonly pluginEnums?: ReadonlyMap<string, PluginEnumDefinition> | undefined;
    /** Locale resolution options for displayName */
    readonly locale?: LocaleResolutionOptions | undefined;
}
/**
 * Schema Builder column method.
 */
interface ColumnMethod {
    /** Column name */
    readonly name: string;
    /** Method name (e.g., 'string', 'integer', 'boolean') */
    readonly method: string;
    /** Method arguments */
    readonly args: readonly (string | number | boolean)[];
    /** Chained modifiers (e.g., nullable(), unique(), default()) */
    readonly modifiers: readonly ColumnModifier[];
}
/**
 * Column modifier (chained method).
 */
interface ColumnModifier {
    /** Modifier method name */
    readonly method: string;
    /** Modifier arguments */
    readonly args?: readonly (string | number | boolean)[] | undefined;
}
/**
 * Foreign key definition for Schema Builder.
 */
interface ForeignKeyDefinition {
    /** Local column(s) */
    readonly columns: readonly string[];
    /** Referenced table */
    readonly references: string;
    /** Referenced column(s) */
    readonly on: readonly string[];
    /** ON DELETE action */
    readonly onDelete?: string | undefined;
    /** ON UPDATE action */
    readonly onUpdate?: string | undefined;
}
/**
 * Index definition for Schema Builder.
 */
interface IndexDefinition {
    /** Index name */
    readonly name?: string | undefined;
    /** Columns in the index */
    readonly columns: readonly string[];
    /** Whether this is a unique index */
    readonly unique: boolean;
}
/**
 * Table blueprint for Schema Builder.
 */
interface TableBlueprint {
    /** Table name */
    readonly tableName: string;
    /** Column definitions */
    readonly columns: readonly ColumnMethod[];
    /** Primary key column(s) */
    readonly primaryKey?: readonly string[] | undefined;
    /** Foreign key constraints */
    readonly foreignKeys: readonly ForeignKeyDefinition[];
    /** Index definitions */
    readonly indexes: readonly IndexDefinition[];
}
/**
 * Migration operation (up or down).
 */
interface MigrationOperation {
    /** Operation type */
    readonly type: 'create' | 'table' | 'drop' | 'dropIfExists';
    /** Table name */
    readonly tableName: string;
    /** Blueprint (for create/table operations) */
    readonly blueprint?: TableBlueprint | undefined;
}
/**
 * Complete migration definition.
 */
interface MigrationDefinition {
    /** Migration class name */
    readonly className: string;
    /** UP operations */
    readonly up: readonly MigrationOperation[];
    /** DOWN operations */
    readonly down: readonly MigrationOperation[];
    /** Database connection */
    readonly connection?: string | undefined;
}

/**
 * @famgia/omnify-laravel - Schema Builder Converter
 *
 * Converts SQL types and operations to Laravel Schema Builder methods.
 */

/**
 * Converts a property name to snake_case column name.
 */
declare function toColumnName(propertyName: string): string;
/**
 * Converts schema name to snake_case plural table name.
 */
declare function toTableName(schemaName: string): string;
/**
 * Options for property to column conversion.
 */
interface PropertyToColumnOptions {
    /** Locale resolution options for displayName */
    locale?: LocaleResolutionOptions;
}
/**
 * Converts a property to Laravel column method.
 */
declare function propertyToColumnMethod(propertyName: string, property: PropertyDefinition, options?: PropertyToColumnOptions): ColumnMethod | null;
/**
 * Generates primary key column method.
 */
declare function generatePrimaryKeyColumn(pkType?: 'Int' | 'BigInt' | 'Uuid' | 'String'): ColumnMethod;
/**
 * Generates timestamp columns.
 */
declare function generateTimestampColumns(): ColumnMethod[];
/**
 * Generates soft delete column.
 */
declare function generateSoftDeleteColumn(): ColumnMethod;
/**
 * Generates foreign key column and constraint from association.
 */
declare function generateForeignKey(propertyName: string, property: PropertyDefinition, allSchemas: SchemaCollection, options?: PropertyToColumnOptions): {
    column: ColumnMethod;
    foreignKey: ForeignKeyDefinition;
    index: IndexDefinition;
} | null;
/**
 * Options for schema to blueprint conversion.
 */
interface SchemaToBlueprintOptions {
    /** Custom types from plugins (for compound type expansion) */
    customTypes?: ReadonlyMap<string, CustomTypeDefinition>;
    /** Plugin enums from registry (for enumRef resolution) */
    pluginEnums?: ReadonlyMap<string, PluginEnumDefinition>;
    /** Locale resolution options for displayName */
    locale?: LocaleResolutionOptions;
}
/**
 * Generates table blueprint from schema.
 */
declare function schemaToBlueprint(schema: LoadedSchema, allSchemas: SchemaCollection, options?: SchemaToBlueprintOptions): TableBlueprint;
/**
 * Formats a column method to PHP code.
 */
declare function formatColumnMethod(column: ColumnMethod): string;
/**
 * Formats a foreign key to PHP code.
 */
declare function formatForeignKey(fk: ForeignKeyDefinition): string;
/**
 * Formats an index to PHP code.
 */
declare function formatIndex(index: IndexDefinition): string;
/**
 * Pivot field definition (simplified from PropertyDefinition for pivot tables).
 */
interface PivotFieldInfo {
    /** Field name in snake_case */
    name: string;
    /** Property type (String, Int, Boolean, Timestamp, Enum, etc.) */
    type: string;
    /** Whether the field can be null */
    nullable?: boolean;
    /** Default value for the field */
    default?: unknown;
    /** String length (for String type) */
    length?: number;
    /** Whether the field is unsigned (for numeric types) */
    unsigned?: boolean;
    /** Enum values (only for type: Enum) - extracted string values */
    enum?: readonly string[];
}
/**
 * Pivot table information for ManyToMany relationships.
 */
interface PivotTableInfo {
    tableName: string;
    sourceTable: string;
    targetTable: string;
    sourceColumn: string;
    targetColumn: string;
    sourcePkType: 'Int' | 'BigInt' | 'Uuid' | 'String';
    targetPkType: 'Int' | 'BigInt' | 'Uuid' | 'String';
    onDelete: string | undefined;
    onUpdate: string | undefined;
    /** Additional fields on the pivot table */
    pivotFields?: PivotFieldInfo[];
}
/**
 * Polymorphic pivot table information for MorphToMany relationships.
 */
interface MorphToManyPivotInfo {
    tableName: string;
    /** The fixed target schema that uses MorphToMany */
    targetTable: string;
    targetColumn: string;
    targetPkType: 'Int' | 'BigInt' | 'Uuid' | 'String';
    /** Base name for polymorphic columns (creates {name}_type and {name}_id) */
    morphName: string;
    /** Schema names that can be morphed to */
    morphTargets: readonly string[];
    onDelete: string | undefined;
    onUpdate: string | undefined;
}
/**
 * Generates pivot table name for ManyToMany relationship.
 * Uses alphabetical ordering for consistency.
 */
declare function generatePivotTableName(sourceTable: string, targetTable: string, customName?: string): string;
/**
 * Extracts ManyToMany relationships from a schema.
 */
declare function extractManyToManyRelations(schema: LoadedSchema, allSchemas: SchemaCollection): PivotTableInfo[];
/**
 * Generates blueprint for a pivot table.
 */
declare function generatePivotTableBlueprint(pivot: PivotTableInfo): TableBlueprint;
/**
 * Extracts MorphToMany relationships from a schema.
 * MorphToMany creates a pivot table with polymorphic type/id columns.
 */
declare function extractMorphToManyRelations(schema: LoadedSchema, allSchemas: SchemaCollection): MorphToManyPivotInfo[];
/**
 * Generates blueprint for a polymorphic pivot table (MorphToMany).
 */
declare function generateMorphToManyPivotBlueprint(pivot: MorphToManyPivotInfo): TableBlueprint;

/**
 * @famgia/omnify-laravel - Migration Generator
 *
 * Generates Laravel migration files from schemas.
 */

/**
 * Generates migrations for all schemas.
 */
declare function generateMigrations(schemas: SchemaCollection, options?: MigrationOptions): MigrationFile[];
/**
 * Generates migration from a single schema.
 */
declare function generateMigrationFromSchema(schema: LoadedSchema, allSchemas: SchemaCollection, options?: MigrationOptions): MigrationFile;
/**
 * Generates drop migration for a table.
 */
declare function generateDropMigrationForTable(tableName: string, options?: MigrationOptions): MigrationFile;
/**
 * Formats migration content for writing to file.
 */
declare function formatMigrationFile(migration: MigrationFile): string;
/**
 * Gets the output path for a migration file.
 */
declare function getMigrationPath(migration: MigrationFile, outputDir?: string): string;

/**
 * @famgia/omnify-laravel - ALTER Migration Generator
 *
 * Generates Laravel migration files for ALTER table operations.
 */

/**
 * Generates ALTER migration for a modified schema.
 */
declare function generateAlterMigration(change: SchemaChange, options?: MigrationOptions): MigrationFile | null;
/**
 * Generates DROP migration for a removed schema.
 */
declare function generateDropTableMigration(schemaName: string, options?: MigrationOptions): MigrationFile;
/**
 * Generates migrations for all schema changes.
 */
declare function generateMigrationsFromChanges(changes: readonly SchemaChange[], options?: MigrationOptions): MigrationFile[];

/**
 * Laravel Model Generator
 *
 * Generates Eloquent model classes from Omnify schemas.
 * Creates base models (auto-generated) and user models (created once).
 */

/**
 * Options for model generation.
 */
interface ModelGeneratorOptions {
    /**
     * Base model namespace.
     * @default 'App\\Models\\OmnifyBase'
     */
    baseModelNamespace?: string;
    /**
     * User model namespace.
     * @default 'App\\Models'
     */
    modelNamespace?: string;
    /**
     * Base model class name.
     * @default 'BaseModel'
     */
    baseModelClassName?: string;
    /**
     * Output path for base models.
     * @default 'app/Models/OmnifyBase'
     */
    baseModelPath?: string;
    /**
     * Output path for user models.
     * @default 'app/Models'
     */
    modelPath?: string;
    /**
     * Output path for service provider files.
     * @default 'app/Providers'
     */
    providersPath?: string;
    /**
     * Custom types registered by plugins.
     * Used to expand compound types in fillable array.
     */
    customTypes?: ReadonlyMap<string, CustomTypeDefinition>;
}
/**
 * Generated model output.
 */
interface GeneratedModel {
    /** File path relative to project root */
    path: string;
    /** PHP content */
    content: string;
    /** Model type */
    type: 'base-model' | 'entity-base' | 'entity' | 'service-provider' | 'provider-registration' | 'trait' | 'locales';
    /** Whether to overwrite existing file */
    overwrite: boolean;
    /** Schema name */
    schemaName: string;
}
/**
 * Provider registration result.
 */
interface ProviderRegistrationResult {
    /** Path to the provider registration file */
    path: string;
    /** Modified content */
    content: string;
    /** Laravel version type */
    laravelVersion: 'laravel11+' | 'laravel10-';
    /** Whether registration was already present */
    alreadyRegistered: boolean;
}
/**
 * Generate all models for the given schemas.
 */
declare function generateModels(schemas: SchemaCollection, options?: ModelGeneratorOptions): GeneratedModel[];
/**
 * Get the output path for a model.
 */
declare function getModelPath(model: GeneratedModel): string;
/**
 * Generate provider registration for Laravel.
 * Handles both Laravel 11+ (bootstrap/providers.php) and Laravel 10- (config/app.php).
 *
 * @param existingContent - Existing file content (null if file doesn't exist)
 * @param laravelVersion - Laravel version type
 * @param laravelRoot - Laravel root directory (e.g., "./backend" or "")
 * @returns Registration result or null if already registered
 */
declare function generateProviderRegistration(existingContent: string | null, laravelVersion: 'laravel11+' | 'laravel10-', laravelRoot?: string): ProviderRegistrationResult | null;

/**
 * Laravel Factory Generator
 *
 * Generates Laravel factory files for Eloquent models.
 */

/**
 * Options for factory generation.
 */
interface FactoryGeneratorOptions {
    /** Model namespace */
    modelNamespace?: string;
    /** Factory output path */
    factoryPath?: string;
    /** Faker locale */
    fakerLocale?: string;
    /** Custom types registered by plugins */
    customTypes?: ReadonlyMap<string, CustomTypeDefinition>;
    /** Plugin enums from registry (for enumRef resolution) */
    pluginEnums?: ReadonlyMap<string, PluginEnumDefinition>;
}
/**
 * Generated factory output.
 */
interface GeneratedFactory {
    /** Factory class name */
    name: string;
    /** Schema name this factory is for */
    schemaName: string;
    /** Output path for the factory file */
    path: string;
    /** Generated factory content */
    content: string;
    /** Whether to overwrite if exists */
    overwrite: boolean;
}
/**
 * Generates factories for all schemas.
 */
declare function generateFactories(schemas: SchemaCollection, options?: FactoryGeneratorOptions): GeneratedFactory[];
/**
 * Gets the output path for a factory.
 */
declare function getFactoryPath(factory: GeneratedFactory): string;

/**
 * AI Guides Generator (Laravel)
 *
 * Laravelプロジェクト用のAIガイド生成
 * @famgia/omnify-coreの統一ジェネレーターを使用
 */
/**
 * Package path configuration for AI guides
 */
interface PackagePath {
    /** Base path of the package (e.g., './packages/omnify-sso-client') */
    base: string;
    /** Models path relative to base (e.g., 'src/Models') */
    modelsPath?: string;
    /** Migrations path relative to base (e.g., 'database/migrations') */
    migrationsPath?: string;
}
/**
 * Options for AI guides generation
 */
interface AIGuidesOptions {
    /**
     * Laravel models path from config (e.g., 'app/Models')
     * Used to extract the base path for glob replacement
     */
    modelsPath?: string;
    /**
     * Laravel migrations path from config
     */
    migrationsPath?: string;
    /**
     * Base path for Laravel files (default: extracted from modelsPath or 'app')
     * Used for placeholder replacement in Cursor rules
     */
    laravelBasePath?: string;
    /**
     * TypeScript/React base path (e.g., 'resources/ts' or 'frontend/src')
     * Used for placeholder replacement in Cursor rules
     */
    typescriptBasePath?: string;
    /**
     * Additional package paths from additionalSchemaPaths config
     * Used to expand globs to include package directories
     */
    packagePaths?: PackagePath[];
}
/**
 * Result of AI guides generation
 */
interface AIGuidesResult {
    claudeGuides: number;
    claudeRules: number;
    claudeChecklists: number;
    claudeWorkflows: number;
    claudeAgents: number;
    claudeOmnify: number;
    cursorRules: number;
    antigravityRules: number;
    files: string[];
}
/**
 * Generate AI guides for Claude and Cursor
 */
declare function generateAIGuides(rootDir: string, options?: AIGuidesOptions): AIGuidesResult;
/**
 * Check if AI guides need to be generated
 */
declare function shouldGenerateAIGuides(rootDir: string): boolean;

export { type AIGuidesOptions, type AIGuidesResult, type ColumnMethod, type ColumnModifier, type FactoryGeneratorOptions, type ForeignKeyDefinition, type GeneratedFactory, type GeneratedModel, type IndexDefinition, type MigrationDefinition, type MigrationFile, type MigrationOperation, type MigrationOptions, type ModelGeneratorOptions, type MorphToManyPivotInfo, type PivotFieldInfo, type PivotTableInfo, type ProviderRegistrationResult, type TableBlueprint, extractManyToManyRelations, extractMorphToManyRelations, formatColumnMethod, formatForeignKey, formatIndex, formatMigrationFile, generateAIGuides, generateAlterMigration, generateDropMigrationForTable, generateDropTableMigration, generateFactories, generateForeignKey, generateMigrationFromSchema, generateMigrations, generateMigrationsFromChanges, generateModels, generateMorphToManyPivotBlueprint, generatePivotTableBlueprint, generatePivotTableName, generatePrimaryKeyColumn, generateProviderRegistration, generateSoftDeleteColumn, generateTimestampColumns, getFactoryPath, getMigrationPath, getModelPath, propertyToColumnMethod, schemaToBlueprint, shouldGenerateAIGuides, toColumnName, toTableName };
