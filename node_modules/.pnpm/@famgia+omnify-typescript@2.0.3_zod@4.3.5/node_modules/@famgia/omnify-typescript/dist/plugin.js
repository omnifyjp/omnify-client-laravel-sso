import {
  generateTypeScript
} from "./chunk-VLDDJNHY.js";

// src/plugin.ts
var DEFAULTS = {
  modelsPath: "resources/ts/omnify"
};
var TYPESCRIPT_CONFIG_SCHEMA = {
  fields: [
    {
      key: "modelsPath",
      type: "path",
      label: "Schemas Output Path",
      description: "Directory for generated TypeScript types and Zod schemas.",
      default: DEFAULTS.modelsPath,
      group: "output"
    },
    {
      key: "generateZodSchemas",
      type: "boolean",
      label: "Generate Zod Schemas",
      description: "Generate Zod schemas alongside TypeScript types for form validation",
      default: true,
      group: "output"
    }
  ]
};
function resolveOptions(options) {
  return {
    modelsPath: options?.modelsPath ?? DEFAULTS.modelsPath,
    generateZodSchemas: options?.generateZodSchemas ?? true
  };
}
function typescriptPlugin(options) {
  const resolved = resolveOptions(options);
  return {
    name: "@famgia/omnify-typescript",
    version: "0.0.1",
    configSchema: TYPESCRIPT_CONFIG_SCHEMA,
    generators: [
      {
        name: "typescript-models",
        description: "Generate TypeScript model definitions",
        generate: async (ctx) => {
          const omnifyBaseDir = "node_modules/@omnify-base";
          const files = generateTypeScript(ctx.schemas, {
            generateZodSchemas: resolved.generateZodSchemas,
            localeConfig: ctx.localeConfig,
            customTypes: ctx.customTypes,
            pluginEnums: ctx.pluginEnums,
            // All generated files (enums, base) go to @omnify-base - they shouldn't be edited
            enumImportPrefix: "@omnify-base/enum",
            pluginEnumImportPrefix: "@omnify-base/enum",
            baseImportPrefix: "@omnify-base/schemas"
          });
          const outputs = [];
          const hasOmnifyClientFiles = files.some(
            (f) => f.category === "enum" || f.category === "plugin-enum" || f.category === "base"
          );
          if (hasOmnifyClientFiles) {
            outputs.push({
              path: `${omnifyBaseDir}/package.json`,
              content: JSON.stringify({
                name: "@omnify-base",
                version: "0.0.0",
                private: true,
                type: "module",
                exports: {
                  // Wildcard exports for TypeScript bundlers (Vite, esbuild, etc.)
                  "./enum/*": {
                    types: "./enum/*.ts",
                    default: "./enum/*.ts"
                  },
                  "./schemas/*": {
                    types: "./schemas/*.ts",
                    default: "./schemas/*.ts"
                  }
                }
              }, null, 2),
              type: "other",
              skipIfExists: false
            });
          }
          for (const file of files) {
            let outputPath;
            if (file.category === "plugin-enum" || file.category === "enum") {
              outputPath = `${omnifyBaseDir}/enum/${file.filePath}`;
            } else if (file.category === "base") {
              const fileName = file.filePath.replace(/^base\//, "");
              outputPath = `${omnifyBaseDir}/schemas/${fileName}`;
            } else if (file.overwrite && (file.filePath === "common.ts" || file.filePath === "i18n.ts")) {
              outputPath = `${omnifyBaseDir}/schemas/${file.filePath}`;
            } else {
              outputPath = `${resolved.modelsPath}/${file.filePath}`;
            }
            outputs.push({
              path: outputPath,
              content: file.content,
              type: "type",
              skipIfExists: !file.overwrite,
              // Invert: overwrite=true means skipIfExists=false
              metadata: {
                types: file.types
              }
            });
          }
          return outputs;
        }
      }
    ]
  };
}
var MODERN_DEFAULTS = DEFAULTS;
var LEGACY_DEFAULTS = DEFAULTS;
function typescriptModern(options) {
  return typescriptPlugin({
    ...options,
    modelsPath: options?.modelsPath ?? DEFAULTS.modelsPath
  });
}
export {
  DEFAULTS,
  LEGACY_DEFAULTS,
  MODERN_DEFAULTS,
  typescriptPlugin as default,
  typescriptModern,
  typescriptPlugin
};
//# sourceMappingURL=plugin.js.map