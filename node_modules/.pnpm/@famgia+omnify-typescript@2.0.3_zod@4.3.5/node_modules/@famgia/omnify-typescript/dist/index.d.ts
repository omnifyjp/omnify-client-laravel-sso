import { LocaleConfig, CustomTypeDefinition, PluginEnumDefinition, PropertyDefinition, SchemaCollection, LoadedSchema } from '@famgia/omnify-types';

/**
 * @famgia/omnify-typescript - TypeScript Types
 *
 * Types for TypeScript code generation.
 */

/**
 * File category for organizing output.
 * - schema: Model schemas (user-editable)
 * - base: Base files (auto-generated, goes to node_modules/@omnify-base/schemas)
 * - enum: Schema enums (user-editable)
 * - plugin-enum: Plugin enums (auto-generated, goes to node_modules/@omnify-base/enum)
 */
type FileCategory = 'schema' | 'base' | 'enum' | 'plugin-enum';
/**
 * Generated TypeScript file.
 */
interface TypeScriptFile {
    /** File path relative to output directory */
    readonly filePath: string;
    /** Full file content */
    readonly content: string;
    /** Types defined in this file */
    readonly types: readonly string[];
    /** Whether this file can be overwritten (base files) or should be preserved (model files) */
    readonly overwrite: boolean;
    /** File category for organizing output (default: 'schema') */
    readonly category?: FileCategory;
}
/**
 * TypeScript generation options.
 */
interface TypeScriptOptions {
    /** Whether to include readonly modifiers */
    readonly readonly?: boolean | undefined;
    /** Whether to use strict null checks compatible types */
    readonly strictNullChecks?: boolean | undefined;
    /**
     * Locale configuration for resolving localized strings.
     * If provided, displayName/description will be resolved to the specified locale.
     */
    readonly localeConfig?: LocaleConfig | undefined;
    /**
     * Target locale for generation.
     * If not provided, uses localeConfig.defaultLocale.
     */
    readonly locale?: string | undefined;
    /**
     * Custom type definitions from plugins.
     * Used to expand compound types like JapaneseName.
     */
    readonly customTypes?: ReadonlyMap<string, CustomTypeDefinition> | undefined;
    /**
     * Generate multi-locale labels instead of resolving to a single locale.
     * When true, labels will be objects like { ja: '...', en: '...' }
     */
    readonly multiLocale?: boolean | undefined;
    /**
     * Custom validation message templates to override defaults.
     * Templates use ${displayName}, ${min}, ${max} placeholders.
     */
    readonly validationTemplates?: Readonly<Record<string, Record<string, string>>> | undefined;
    /**
     * @deprecated Use generateZodSchemas instead. Legacy Ant Design rules generation.
     * When generateZodSchemas is true (default), this option is ignored.
     */
    readonly generateRules?: boolean | undefined;
    /**
     * Generate Zod schemas alongside TypeScript interfaces.
     * When true (default), generates Zod schemas in base files for form validation.
     * The legacy rules/ folder generation is skipped when this is enabled.
     * @default true
     */
    readonly generateZodSchemas?: boolean | undefined;
    /**
     * Import path prefix for enums when enumPath is separate from schemasPath.
     * Used when enums are placed outside the schemas folder.
     * @example '../enum' - for structure like omnify/schemas/ and omnify/enum/
     * @default './enum' - enums inside schemas folder (legacy)
     */
    readonly enumImportPrefix?: string | undefined;
    /**
     * Plugin-provided enums (e.g., Prefecture, BankAccountType from japan-types).
     * These are generated alongside schema enums in the enum/ folder.
     */
    readonly pluginEnums?: ReadonlyMap<string, PluginEnumDefinition> | undefined;
    /**
     * Whether to add .js extension to import paths.
     * Set to true for native ESM (moduleResolution: node16/nodenext).
     * Set to false when using bundlers (Vite, webpack, etc.) that handle module resolution.
     * @default false
     */
    readonly useJsExtension?: boolean | undefined;
    /**
     * Import path prefix for plugin enums.
     * Plugin enums are generated to node_modules/@omnify-base/enum/ and imported from this path.
     * @example '@omnify-base/enum' - for node_modules/@omnify-base/enum with package alias
     * @default '../enum/plugin' - legacy behavior (plugin enums in enum/plugin/)
     */
    readonly pluginEnumImportPrefix?: string | undefined;
    /**
     * Import path prefix for base schema files.
     * Base files are generated to node_modules/@omnify-base/schemas/ and imported from this path.
     * @example '@omnify-base/schemas' - for node_modules/@omnify-base/schemas with package alias
     * @default './base' - legacy behavior (base files in schemas/base/)
     */
    readonly baseImportPrefix?: string | undefined;
    /**
     * Import path prefix for schema enums (used in base files).
     * When base files are in node_modules, they need absolute paths to import schema enums.
     * @example '@omnify/enum' - for user's enum folder with alias
     * @default '../enum' - relative path from base/ folder
     */
    readonly schemaEnumImportPrefix?: string | undefined;
}
/**
 * TypeScript property definition.
 */
interface TSProperty {
    /** Property name */
    readonly name: string;
    /** TypeScript type */
    readonly type: string;
    /** Whether the property is optional */
    readonly optional: boolean;
    /** Whether the property is readonly */
    readonly readonly: boolean;
    /** JSDoc comment */
    readonly comment?: string | undefined;
}
/**
 * TypeScript interface definition.
 */
interface TSInterface {
    /** Interface name */
    readonly name: string;
    /** Properties */
    readonly properties: readonly TSProperty[];
    /** Extended interfaces */
    readonly extends?: readonly string[] | undefined;
    /** JSDoc comment */
    readonly comment?: string | undefined;
    /** Dependencies - other interfaces that need to be imported */
    readonly dependencies?: readonly string[] | undefined;
    /** Enum dependencies - enums that need to be imported from enum/ folder */
    readonly enumDependencies?: readonly string[] | undefined;
}
/**
 * TypeScript enum definition.
 */
interface TSEnum {
    /** Enum name */
    readonly name: string;
    /** Enum values */
    readonly values: readonly TSEnumValue[];
    /** JSDoc comment */
    readonly comment?: string | undefined;
}
/**
 * Multi-locale string map.
 */
type LocaleMap = Readonly<Record<string, string>>;
/**
 * TypeScript enum value.
 */
interface TSEnumValue {
    /** Value name (PascalCase) */
    readonly name: string;
    /** Value (string or number) */
    readonly value: string | number;
    /** Display label - single string or multi-locale map */
    readonly label?: string | LocaleMap | undefined;
    /** Extra metadata (optional) */
    readonly extra?: Readonly<Record<string, unknown>> | undefined;
}
/**
 * TypeScript type alias definition.
 */
interface TSTypeAlias {
    /** Type name */
    readonly name: string;
    /** Type definition */
    readonly type: string;
    /** JSDoc comment */
    readonly comment?: string | undefined;
}

/**
 * @famgia/omnify-laravel - TypeScript Interface Generator
 *
 * Generates TypeScript interfaces from schemas.
 */

/**
 * Converts property name to TypeScript property name.
 * Preserves camelCase.
 */
declare function toPropertyName(name: string): string;
/**
 * Converts schema name to TypeScript interface name.
 * Preserves PascalCase.
 */
declare function toInterfaceName(schemaName: string): string;
/**
 * Gets TypeScript type for a property.
 */
declare function getPropertyType(property: PropertyDefinition, _allSchemas: SchemaCollection): string;
/**
 * Converts a property to TypeScript property definition (legacy - returns single property).
 */
declare function propertyToTSProperty(propertyName: string, property: PropertyDefinition, allSchemas: SchemaCollection, options?: TypeScriptOptions): TSProperty;
/**
 * Generates TypeScript interface from schema.
 */
declare function schemaToInterface(schema: LoadedSchema, allSchemas: SchemaCollection, options?: TypeScriptOptions): TSInterface;
/**
 * Formats a TypeScript property.
 */
declare function formatProperty(property: TSProperty): string;
/**
 * Formats a TypeScript interface.
 */
declare function formatInterface(iface: TSInterface): string;
/**
 * Generates interfaces for all schemas.
 * Note: File interface is now generated from File.yaml schema (use ensureFileSchema() to auto-create it).
 */
declare function generateInterfaces(schemas: SchemaCollection, options?: TypeScriptOptions): TSInterface[];

/**
 * @famgia/omnify-typescript - TypeScript Enum Generator
 *
 * Generates TypeScript enums with helper methods from schema enum definitions.
 */

/**
 * Converts enum value to valid TypeScript enum member name.
 */
declare function toEnumMemberName(value: string): string;
/**
 * Converts schema name to TypeScript enum name.
 */
declare function toEnumName(schemaName: string): string;
/**
 * Generates TypeScript enum from schema enum.
 */
declare function schemaToEnum(schema: LoadedSchema, options?: TypeScriptOptions): TSEnum | null;
/**
 * Generates enums for all enum schemas.
 */
declare function generateEnums(schemas: SchemaCollection, options?: TypeScriptOptions): TSEnum[];
/**
 * Converts a plugin enum definition to TSEnum.
 * Plugin enums come from plugins like @famgia/omnify-japan (e.g., Prefecture, BankAccountType).
 */
declare function pluginEnumToTSEnum(enumDef: PluginEnumDefinition, options?: TypeScriptOptions): TSEnum;
/**
 * Generates enums from plugin enum definitions.
 */
declare function generatePluginEnums(pluginEnums: ReadonlyMap<string, PluginEnumDefinition>, options?: TypeScriptOptions): TSEnum[];
/**
 * Formats a TypeScript enum with helper methods.
 */
declare function formatEnum(enumDef: TSEnum): string;
/**
 * Generates a union type alias as an alternative to enum.
 */
declare function enumToUnionType(enumDef: TSEnum): TSTypeAlias;
/**
 * Formats a TypeScript type alias with helper methods.
 */
declare function formatTypeAlias(alias: TSTypeAlias): string;
/**
 * Result of extracting inline enums - can be type alias or full enum with labels.
 */
interface ExtractedInlineEnum {
    /** Type alias for simple enums */
    typeAlias?: TSTypeAlias;
    /** Full enum with i18n labels */
    enum?: TSEnum;
}
/**
 * Extracts inline enums from properties for type generation.
 * Returns both type aliases (simple enums) and full enums (with i18n labels).
 */
declare function extractInlineEnums(schemas: SchemaCollection, options?: TypeScriptOptions): ExtractedInlineEnum[];

/**
 * @famgia/omnify-typescript - TypeScript Generator
 *
 * Generates TypeScript models with base/model pattern:
 * - models/base/[SchemaName].ts - Auto-generated base interfaces, DO NOT EDIT
 * - models/enum/[EnumName].ts - Auto-generated enums/type aliases, DO NOT EDIT
 * - models/[SchemaName].ts - Extends base, user can customize
 * - models/index.ts - Re-exports all
 */

/**
 * Generates TypeScript files with base/model pattern.
 *
 * Output structure:
 * - models/base/[SchemaName].ts - Auto-generated base interfaces (always overwritten)
 * - models/enum/[EnumName].ts - Auto-generated enums/type aliases (always overwritten)
 * - models/[SchemaName].ts - User-editable models that extend base (created once, never overwritten)
 * - models/index.ts - Re-exports (always overwritten)
 */
declare function generateTypeScript(schemas: SchemaCollection, options?: TypeScriptOptions): TypeScriptFile[];

/**
 * Built-in validation message templates for common languages.
 * Templates use ${displayName}, ${min}, ${max}, ${pattern} placeholders.
 */
interface ValidationTemplates {
    readonly required: Record<string, string>;
    readonly minLength: Record<string, string>;
    readonly maxLength: Record<string, string>;
    readonly min: Record<string, string>;
    readonly max: Record<string, string>;
    readonly email: Record<string, string>;
    readonly url: Record<string, string>;
    readonly pattern: Record<string, string>;
    readonly enum: Record<string, string>;
}
/**
 * Default validation message templates.
 * Supports: ja (Japanese), en (English), vi (Vietnamese), ko (Korean), zh (Chinese)
 */
declare const DEFAULT_VALIDATION_TEMPLATES: ValidationTemplates;
/**
 * Merge user templates with default templates.
 */
declare function mergeValidationTemplates(userTemplates?: Partial<ValidationTemplates>): ValidationTemplates;
/**
 * Format a validation message with placeholders.
 */
declare function formatValidationMessage(template: string, vars: Record<string, string | number>): string;
/**
 * Get validation messages for all configured locales.
 * Fallback order: locale -> fallbackLocale -> 'en'
 */
declare function getValidationMessages(templates: ValidationTemplates, ruleType: keyof ValidationTemplates, locales: string[], vars: Record<string, string | number>, fallbackLocale?: string): Record<string, string>;

/**
 * Generates Ant Design compatible validation rules from schemas.
 */

/**
 * Ant Design rule structure with multi-locale message.
 */
interface AntdRule {
    required?: boolean;
    type?: 'string' | 'number' | 'email' | 'url' | 'integer';
    min?: number;
    max?: number;
    len?: number;
    pattern?: string;
    message: LocaleMap;
}
/**
 * Property rules for a model.
 */
interface PropertyRules {
    displayName: LocaleMap;
    rules: AntdRule[];
}
/**
 * Model rules structure.
 */
interface ModelRules {
    displayName: LocaleMap;
    properties: Record<string, PropertyRules>;
}
/**
 * Generate rules for a schema.
 */
declare function generateModelRules(schema: LoadedSchema, locales: string[], fallbackLocale: string, templates: ValidationTemplates): ModelRules;
/**
 * Generate rules files for all schemas.
 */
declare function generateRulesFiles(schemas: SchemaCollection, options?: TypeScriptOptions): TypeScriptFile[];

/**
 * AI Guides Generator for TypeScript/Frontend
 *
 * TypeScript/Reactプロジェクト用のAIガイド生成
 * @famgia/omnify-coreの統一ジェネレーターを使用
 */
/**
 * Options for AI guides generation
 */
interface AIGuidesOptions {
    /**
     * TypeScript output path from config (e.g., 'resources/ts/omnify')
     * Used to extract the base path for glob replacement
     */
    typescriptPath?: string;
    /**
     * Base path for TypeScript files (default: extracted from typescriptPath or 'src')
     * Used for placeholder replacement in Cursor rules
     */
    typescriptBasePath?: string;
}
/**
 * Result of AI guides generation
 */
interface AIGuidesResult {
    claudeGuides: number;
    claudeChecklists: number;
    cursorRules: number;
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

/**
 * Stubs management for TypeScript generator
 *
 * Currently a placeholder - React utility stubs feature is not yet implemented.
 */
interface CopyStubsOptions {
    targetDir: string;
    skipIfExists?: boolean;
}
interface CopyStubsResult {
    copied: string[];
    skipped: string[];
}
/**
 * Copy React utility stubs to target directory.
 *
 * Currently returns empty result as React utility stubs feature
 * is not yet implemented. The AI guides are handled separately
 * via generateAIGuides().
 */
declare function copyStubs(_options: CopyStubsOptions): CopyStubsResult;

export { type AIGuidesOptions, type AIGuidesResult, type CopyStubsOptions, type CopyStubsResult, DEFAULT_VALIDATION_TEMPLATES, type ExtractedInlineEnum, type LocaleMap, type TSEnum, type TSEnumValue, type TSInterface, type TSProperty, type TSTypeAlias, type TypeScriptFile, type TypeScriptOptions, type ValidationTemplates, copyStubs, enumToUnionType, extractInlineEnums, formatEnum, formatInterface, formatProperty, formatTypeAlias, formatValidationMessage, generateAIGuides, generateEnums, generateInterfaces, generateModelRules, generatePluginEnums, generateRulesFiles, generateTypeScript, generateTypeScript as generateTypeScriptFiles, getPropertyType, getValidationMessages, mergeValidationTemplates, pluginEnumToTSEnum, propertyToTSProperty, schemaToEnum, schemaToInterface, shouldGenerateAIGuides, toEnumMemberName, toEnumName, toInterfaceName, toPropertyName };
