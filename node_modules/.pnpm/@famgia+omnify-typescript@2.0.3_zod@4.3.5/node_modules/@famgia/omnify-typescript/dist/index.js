import {
  DEFAULT_VALIDATION_TEMPLATES,
  enumToUnionType,
  extractInlineEnums,
  formatEnum,
  formatInterface,
  formatProperty,
  formatTypeAlias,
  formatValidationMessage,
  generateEnums,
  generateInterfaces,
  generateModelRules,
  generatePluginEnums,
  generateRulesFiles,
  generateTypeScript,
  getPropertyType,
  getValidationMessages,
  mergeValidationTemplates,
  pluginEnumToTSEnum,
  propertyToTSProperty,
  schemaToEnum,
  schemaToInterface,
  toEnumMemberName,
  toEnumName,
  toInterfaceName,
  toPropertyName
} from "./chunk-VLDDJNHY.js";

// src/ai-guides/generator.ts
import { existsSync, readdirSync } from "fs";
import { resolve } from "path";
import {
  generateAIGuides as coreGenerateAIGuides
} from "@famgia/omnify-core";
function extractTypescriptBasePath(typescriptPath) {
  if (!typescriptPath) return "src";
  const normalized = typescriptPath.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length > 1) {
    return parts.slice(0, -1).join("/");
  }
  return "src";
}
function generateAIGuides(rootDir, options = {}) {
  const basePath = options.typescriptBasePath || extractTypescriptBasePath(options.typescriptPath);
  const coreResult = coreGenerateAIGuides(rootDir, {
    placeholders: {
      TYPESCRIPT_BASE: basePath,
      LARAVEL_BASE: "app",
      LARAVEL_ROOT: ""
    },
    // TypeScriptプロジェクトではReact関連のみ
    adapters: ["cursor", "claude"]
  });
  const result = {
    claudeGuides: 0,
    claudeChecklists: 0,
    cursorRules: 0,
    files: coreResult.files
  };
  const claudeCount = coreResult.counts["claude"] || 0;
  const cursorCount = coreResult.counts["cursor"] || 0;
  result.claudeGuides = Math.floor(claudeCount * 0.8);
  result.claudeChecklists = claudeCount - result.claudeGuides;
  result.cursorRules = cursorCount;
  return result;
}
function shouldGenerateAIGuides(rootDir) {
  const claudeDir = resolve(rootDir, ".claude/omnify/guides/react");
  const cursorDir = resolve(rootDir, ".cursor/rules/omnify");
  if (!existsSync(claudeDir) || !existsSync(cursorDir)) {
    return true;
  }
  try {
    const claudeFiles = readdirSync(claudeDir);
    const cursorFiles = readdirSync(cursorDir);
    return claudeFiles.length === 0 || cursorFiles.length === 0;
  } catch {
    return true;
  }
}

// src/stubs.ts
function copyStubs(_options) {
  return {
    copied: [],
    skipped: []
  };
}
export {
  DEFAULT_VALIDATION_TEMPLATES,
  copyStubs,
  enumToUnionType,
  extractInlineEnums,
  formatEnum,
  formatInterface,
  formatProperty,
  formatTypeAlias,
  formatValidationMessage,
  generateAIGuides,
  generateEnums,
  generateInterfaces,
  generateModelRules,
  generatePluginEnums,
  generateRulesFiles,
  generateTypeScript,
  generateTypeScript as generateTypeScriptFiles,
  getPropertyType,
  getValidationMessages,
  mergeValidationTemplates,
  pluginEnumToTSEnum,
  propertyToTSProperty,
  schemaToEnum,
  schemaToInterface,
  shouldGenerateAIGuides,
  toEnumMemberName,
  toEnumName,
  toInterfaceName,
  toPropertyName
};
//# sourceMappingURL=index.js.map