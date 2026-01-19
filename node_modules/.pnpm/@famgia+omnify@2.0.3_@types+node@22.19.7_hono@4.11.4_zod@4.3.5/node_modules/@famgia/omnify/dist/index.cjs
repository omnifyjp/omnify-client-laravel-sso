"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  Omnify: () => import_omnify_core.Omnify,
  PluginManager: () => import_omnify_core.PluginManager,
  compareSchemas: () => import_omnify_atlas.compareSchemas,
  createOmnify: () => import_omnify_core.createOmnify,
  defineConfig: () => import_omnify_cli.defineConfig,
  diffHclSchemas: () => import_omnify_atlas.diffHclSchemas,
  findReferencedSchemas: () => import_omnify_core.findReferencedSchemas,
  findReferencingSchemas: () => import_omnify_core.findReferencingSchemas,
  generateEnums: () => import_omnify_typescript.generateEnums,
  generateHclSchema: () => import_omnify_atlas.generateHclSchema,
  generateInterfaces: () => import_omnify_typescript.generateInterfaces,
  generateMigrationFromSchema: () => import_omnify_laravel.generateMigrationFromSchema,
  generateMigrations: () => import_omnify_laravel.generateMigrations,
  generatePreview: () => import_omnify_atlas.generatePreview,
  generateTypeScript: () => import_omnify_typescript.generateTypeScript,
  generateTypeScriptFiles: () => import_omnify_typescript.generateTypeScriptFiles,
  getEntitySchemas: () => import_omnify_core.getEntitySchemas,
  getEnumSchemas: () => import_omnify_core.getEnumSchemas,
  getGroups: () => import_omnify_core.getGroups,
  getRelationshipGraph: () => import_omnify_core.getRelationshipGraph,
  getSchemaMetadata: () => import_omnify_core.getSchemaMetadata,
  getSchemaNames: () => import_omnify_core.getSchemaNames,
  getSchemasByGroup: () => import_omnify_core.getSchemasByGroup,
  getTopologicalOrder: () => import_omnify_core.getTopologicalOrder,
  hasCircularReferences: () => import_omnify_core.hasCircularReferences,
  introspectSchema: () => import_omnify_core.introspectSchema,
  introspectSchemas: () => import_omnify_core.introspectSchemas,
  loadConfig: () => import_omnify_cli.loadConfig,
  loadSchemas: () => import_omnify_core.loadSchemas,
  parseDiffOutput: () => import_omnify_atlas.parseDiffOutput,
  readLockFile: () => import_omnify_atlas.readLockFile,
  renderHcl: () => import_omnify_atlas.renderHcl,
  runAtlasDiff: () => import_omnify_atlas.runAtlasDiff,
  schemaToBlueprint: () => import_omnify_laravel.schemaToBlueprint,
  schemaToInterface: () => import_omnify_typescript.schemaToInterface,
  validateSchemas: () => import_omnify_core.validateSchemas,
  writeLockFile: () => import_omnify_atlas.writeLockFile
});
module.exports = __toCommonJS(index_exports);
var import_omnify_cli = require("@famgia/omnify-cli");
var import_omnify_core = require("@famgia/omnify-core");
var import_omnify_laravel = require("@famgia/omnify-laravel");
var import_omnify_typescript = require("@famgia/omnify-typescript");
var import_omnify_atlas = require("@famgia/omnify-atlas");
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Omnify,
  PluginManager,
  compareSchemas,
  createOmnify,
  defineConfig,
  diffHclSchemas,
  findReferencedSchemas,
  findReferencingSchemas,
  generateEnums,
  generateHclSchema,
  generateInterfaces,
  generateMigrationFromSchema,
  generateMigrations,
  generatePreview,
  generateTypeScript,
  generateTypeScriptFiles,
  getEntitySchemas,
  getEnumSchemas,
  getGroups,
  getRelationshipGraph,
  getSchemaMetadata,
  getSchemaNames,
  getSchemasByGroup,
  getTopologicalOrder,
  hasCircularReferences,
  introspectSchema,
  introspectSchemas,
  loadConfig,
  loadSchemas,
  parseDiffOutput,
  readLockFile,
  renderHcl,
  runAtlasDiff,
  schemaToBlueprint,
  schemaToInterface,
  validateSchemas,
  writeLockFile
});
//# sourceMappingURL=index.cjs.map