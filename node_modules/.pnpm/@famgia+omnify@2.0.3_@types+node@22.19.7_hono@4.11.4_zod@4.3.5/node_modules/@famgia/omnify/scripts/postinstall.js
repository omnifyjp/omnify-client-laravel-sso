#!/usr/bin/env node

/**
 * @famgia/omnify postinstall
 *
 * Sets up AI assistant integration:
 * 1. Generate combined JSON Schema (for YAML validation in editors)
 * 2. Copy AI guides to .claude/omnify/
 * 3. Create/update CLAUDE.md
 * 4. Create .cursor/rules/omnify.md
 * 5. Configure Claude MCP server
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// Content Templates
// ============================================================================

const CLAUDE_MD_SECTION = `## Omnify

This project uses Omnify for schema-driven code generation.

**Documentation**: \`.claude/omnify/\`
- \`schema-guide.md\` - Schema format and property types
- \`config-guide.md\` - Configuration (omnify.config.ts)
- \`laravel-guide.md\` - Laravel generator (if installed)
- \`typescript-guide.md\` - TypeScript generator (if installed)

**Commands**:
- \`npx omnify generate\` - Generate code from schemas
- \`npx omnify validate\` - Validate schemas
`;

const CURSOR_RULES = `# Omnify Schema Rules

This project uses Omnify for schema-driven code generation.
Schemas are in \`schemas/\` directory with \`.yaml\` extension.

For detailed documentation, read these files:
- .claude/omnify/schema-guide.md - Base schema format
- .claude/omnify/config-guide.md - Configuration (omnify.config.ts)
- .claude/omnify/laravel-guide.md - Laravel generator (if exists)
- .claude/omnify/typescript-guide.md - TypeScript generator (if exists)

Commands:
- npx omnify generate - Generate code from schemas
- npx omnify validate - Validate all schemas
`;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Reads omnify.config.ts and extracts the TypeScript output path.
 * Returns null if not found or on error.
 */
function getOmnifyTypescriptPath(projectRoot) {
  const configPaths = [
    path.join(projectRoot, 'omnify.config.ts'),
    path.join(projectRoot, 'omnify.config.js'),
  ];

  for (const configPath of configPaths) {
    if (!fs.existsSync(configPath)) continue;

    try {
      const content = fs.readFileSync(configPath, 'utf-8');
      // Simple regex to extract typescript.path
      const match = content.match(/typescript\s*:\s*\{[^}]*path\s*:\s*['"]([^'"]+)['"]/);
      if (match) {
        return match[1].replace(/^\.\//, ''); // Remove leading ./
      }
    } catch { /* ignore */ }
  }

  return null;
}

/**
 * Parse tsconfig.json content (handling comments)
 */
function parseTsconfig(content) {
  // Remove single-line comments only (block comments can conflict with paths like @/*)
  const jsonContent = content
    .split('\n')
    .map(line => {
      const commentIdx = line.indexOf('//');
      if (commentIdx === -1) return line;
      // Simple check: if there's an odd number of quotes before //, it's inside a string
      const beforeComment = line.slice(0, commentIdx);
      const quoteCount = (beforeComment.match(/"/g) || []).length;
      return quoteCount % 2 === 0 ? beforeComment : line;
    })
    .join('\n');
  return JSON.parse(jsonContent);
}

/**
 * Update a single tsconfig.json with @omnify alias
 */
function updateTsconfigWithAlias(tsconfigPath, aliasPath) {
  try {
    const content = fs.readFileSync(tsconfigPath, 'utf-8');
    const tsconfig = parseTsconfig(content);

    // Initialize compilerOptions if not present
    if (!tsconfig.compilerOptions) {
      tsconfig.compilerOptions = {};
    }

    // Initialize paths if not present
    if (!tsconfig.compilerOptions.paths) {
      tsconfig.compilerOptions.paths = {};
    }

    // Check if @omnify alias already exists
    if (tsconfig.compilerOptions.paths['@omnify/*']) {
      return false; // Already configured
    }

    // Add @omnify alias
    tsconfig.compilerOptions.paths['@omnify/*'] = [`${aliasPath}/*`];

    // Ensure baseUrl is set (required for paths to work)
    if (!tsconfig.compilerOptions.baseUrl) {
      tsconfig.compilerOptions.baseUrl = '.';
    }

    // Write back with proper formatting
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2) + '\n');
    return true;
  } catch {
    return false;
  }
}

/**
 * Setup @omnify alias in tsconfig.json files
 * Handles monorepo structures by finding tsconfig in the same directory tree as omnifyPath
 */
function setupTsconfigAlias(projectRoot, omnifyPath) {
  const updated = [];

  // Normalize omnify path (e.g., "./frontend/src/omnify" → "frontend/src/omnify")
  const normalizedPath = omnifyPath.replace(/^\.\//, '');

  // Find the directory containing omnify output
  const omnifyDir = path.dirname(normalizedPath);

  // Strategy: Look for tsconfig.json in:
  // 1. Same directory as omnify output (e.g., frontend/src/tsconfig.json)
  // 2. Parent directories up to the package root (e.g., frontend/tsconfig.json)
  // 3. Project root (e.g., ./tsconfig.json)

  const searchDirs = [];
  let currentDir = omnifyDir;
  while (currentDir && currentDir !== '.') {
    searchDirs.push(currentDir);
    currentDir = path.dirname(currentDir);
  }
  searchDirs.push('.'); // Add project root

  for (const dir of searchDirs) {
    const tsconfigPath = path.join(projectRoot, dir, 'tsconfig.json');
    if (!fs.existsSync(tsconfigPath)) continue;

    // Calculate relative path from tsconfig location to omnify
    let relativePath;
    if (dir === '.') {
      relativePath = normalizedPath;
    } else {
      // Get relative path from tsconfig dir to omnify dir
      relativePath = path.relative(dir, normalizedPath);
    }

    if (updateTsconfigWithAlias(tsconfigPath, relativePath)) {
      updated.push(path.join(dir, 'tsconfig.json'));
    }
  }

  return updated;
}

/**
 * Setup @omnify alias in vite.config.ts
 */
function setupViteAlias(projectRoot, omnifyPath) {
  const vitePaths = [
    path.join(projectRoot, 'vite.config.ts'),
    path.join(projectRoot, 'vite.config.js'),
    path.join(projectRoot, 'vite.config.mts'),
  ];

  const viteConfigPath = vitePaths.find(p => fs.existsSync(p));
  if (!viteConfigPath) return false;

  try {
    let content = fs.readFileSync(viteConfigPath, 'utf-8');

    // Check if @omnify alias already exists
    if (content.includes('@omnify')) {
      return false; // Already configured
    }

    // Check if resolve.alias exists
    if (content.includes('resolve:') && content.includes('alias:')) {
      // Add to existing alias object
      const aliasMatch = content.match(/(alias\s*:\s*\{)/);
      if (aliasMatch) {
        const insertPos = content.indexOf(aliasMatch[0]) + aliasMatch[0].length;
        const aliasLine = `\n      '@omnify': path.resolve(__dirname, '${omnifyPath}'),`;
        content = content.slice(0, insertPos) + aliasLine + content.slice(insertPos);
      }
    } else if (content.includes('resolve:')) {
      // Add alias to existing resolve object
      const resolveMatch = content.match(/(resolve\s*:\s*\{)/);
      if (resolveMatch) {
        const insertPos = content.indexOf(resolveMatch[0]) + resolveMatch[0].length;
        const aliasBlock = `\n    alias: {\n      '@omnify': path.resolve(__dirname, '${omnifyPath}'),\n    },`;
        content = content.slice(0, insertPos) + aliasBlock + content.slice(insertPos);
      }
    } else {
      // Add resolve.alias to defineConfig
      const defineConfigMatch = content.match(/(defineConfig\s*\(\s*\{)/);
      if (defineConfigMatch) {
        const insertPos = content.indexOf(defineConfigMatch[0]) + defineConfigMatch[0].length;
        const resolveBlock = `\n  resolve: {\n    alias: {\n      '@omnify': path.resolve(__dirname, '${omnifyPath}'),\n    },\n  },`;
        content = content.slice(0, insertPos) + resolveBlock + content.slice(insertPos);
      }
    }

    // Add path import if not present
    if (!content.includes("import path from") && !content.includes("import * as path from") && !content.includes("const path = require")) {
      if (content.startsWith('import ')) {
        content = `import path from 'path';\n` + content;
      } else {
        // Find first import and add before it
        const firstImport = content.indexOf('import ');
        if (firstImport !== -1) {
          content = content.slice(0, firstImport) + `import path from 'path';\n` + content.slice(firstImport);
        }
      }
    }

    fs.writeFileSync(viteConfigPath, content);
    return true;
  } catch {
    return false;
  }
}

function findProjectRoot() {
  let dir = process.env.INIT_CWD || process.cwd();
  const idx = dir.indexOf('node_modules');
  if (idx !== -1) dir = dir.substring(0, idx - 1);
  return fs.existsSync(path.join(dir, 'package.json')) ? dir : null;
}

function copyFiles(srcDir, destDir) {
  if (!fs.existsSync(srcDir)) return [];
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const copied = [];
  for (const file of fs.readdirSync(srcDir)) {
    const src = path.join(srcDir, file);
    if (fs.statSync(src).isFile()) {
      fs.copyFileSync(src, path.join(destDir, file));
      copied.push(file);
    }
  }
  return copied;
}

// ============================================================================
// Setup Functions
// ============================================================================

function generateCombinedSchema(projectRoot) {
  const nodeModules = path.join(projectRoot, 'node_modules');
  const outputDir = path.join(nodeModules, '.omnify');
  const outputPath = path.join(outputDir, 'combined-schema.json');

  // Find base schema
  const searchPaths = [
    path.join(nodeModules, '@famgia/omnify-types/schemas/omnify-schema.json'),
    path.join(nodeModules, '@famgia/omnify/node_modules/@famgia/omnify-types/schemas/omnify-schema.json'),
  ];

  // Also check pnpm hoisted location
  const pnpmDir = path.join(nodeModules, '.pnpm');
  if (fs.existsSync(pnpmDir)) {
    const match = fs.readdirSync(pnpmDir).find(f => f.startsWith('@famgia+omnify-types@'));
    if (match) {
      searchPaths.push(path.join(pnpmDir, match, 'node_modules/@famgia/omnify-types/schemas/omnify-schema.json'));
    }
  }

  const baseSchemaPath = searchPaths.find(p => fs.existsSync(p));
  if (!baseSchemaPath) return false;

  try {
    const baseSchema = JSON.parse(fs.readFileSync(baseSchemaPath, 'utf-8'));

    // Find plugin schema contributions
    const famgiaDir = path.join(nodeModules, '@famgia');
    if (fs.existsSync(famgiaDir)) {
      for (const pkg of fs.readdirSync(famgiaDir)) {
        if (!pkg.startsWith('omnify-') || pkg === 'omnify-types' || pkg === 'omnify-mcp') continue;

        const contributionPath = path.join(famgiaDir, pkg, 'schemas/schema-contribution.json');
        if (fs.existsSync(contributionPath)) {
          try {
            const contribution = JSON.parse(fs.readFileSync(contributionPath, 'utf-8'));

            // Merge definitions
            if (contribution.definitions) {
              Object.assign(baseSchema.definitions, contribution.definitions);
            }

            // Add property types
            if (contribution.propertyTypes && baseSchema.definitions.PropertyDefinition) {
              for (const typeName of contribution.propertyTypes) {
                baseSchema.definitions.PropertyDefinition.oneOf.push({
                  "$ref": `#/definitions/${typeName}`
                });
              }
            }
          } catch { /* skip invalid */ }
        }
      }
    }

    baseSchema.$id = 'omnify://combined-schema.json';
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(outputPath, JSON.stringify(baseSchema, null, 2));
    return true;
  } catch {
    return false;
  }
}

// NOTE: AI guides are now copied during 'npx omnify generate' instead of postinstall
// This ensures guides are always up-to-date when code is generated

function setupClaudeMd(projectRoot) {
  const filePath = path.join(projectRoot, 'CLAUDE.md');

  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    const match = content.match(/## Omnify[^\n]*/);

    if (match) {
      // Replace existing section
      const startIdx = content.indexOf(match[0]);
      let endIdx = content.length;
      const after = content.substring(startIdx + match[0].length);

      for (const marker of ['## ', '---', '# ']) {
        const idx = after.indexOf('\n' + marker);
        if (idx !== -1 && idx < endIdx - startIdx - match[0].length) {
          endIdx = startIdx + match[0].length + idx + 1;
        }
      }

      content = content.substring(0, startIdx) + CLAUDE_MD_SECTION + content.substring(endIdx);
    } else {
      // Append section
      content = content.trimEnd() + '\n\n' + CLAUDE_MD_SECTION;
    }

    fs.writeFileSync(filePath, content);
  } else {
    fs.writeFileSync(filePath, CLAUDE_MD_SECTION);
  }
}

function setupCursorRules(projectRoot) {
  const dir = path.join(projectRoot, '.cursor', 'rules');
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'omnify.md'), CURSOR_RULES);
}

function setupClaudeMcp() {
  const configPath = path.join(os.homedir(), '.claude', 'claude_desktop_config.json');

  try {
    const dir = path.dirname(configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    let config = { mcpServers: {} };
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        config.mcpServers = config.mcpServers || {};
      } catch { /* use default */ }
    }

    if (!config.mcpServers.omnify) {
      config.mcpServers.omnify = { command: 'npx', args: ['@famgia/omnify-mcp'] };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
    }
  } catch { /* optional, ignore errors */ }
}

// ============================================================================
// Main
// ============================================================================

/**
 * Get package version from package.json
 */
function getPackageVersion() {
  try {
    const pkgPath = path.join(__dirname, '..', 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    return pkg.version;
  } catch {
    return null;
  }
}

function main() {
  // Skip in CI
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) return;

  // Skip in monorepo source (but allow examples/)
  const projectDir = process.env.INIT_CWD || process.cwd();
  if (projectDir.includes('omnify-ts') && !projectDir.includes('omnify-ts/examples')) return;

  const projectRoot = findProjectRoot();
  if (!projectRoot) return;

  const version = getPackageVersion();
  const versionStr = version ? ` v${version}` : '';

  console.log(`\n📦 @famgia/omnify${versionStr} installed!`);
  console.log('🔧 Setting up AI integration...\n');

  const results = [];

  if (generateCombinedSchema(projectRoot)) {
    results.push('✓ Generated combined JSON schema');
  }

  // AI guides are now copied during 'npx omnify generate'
  // This ensures guides are always in sync with generated code

  try {
    setupClaudeMd(projectRoot);
    results.push('✓ Updated CLAUDE.md');
  } catch { /* ignore */ }

  try {
    setupCursorRules(projectRoot);
    results.push('✓ Updated .cursor/rules/omnify.md');
  } catch { /* ignore */ }

  setupClaudeMcp();

  // Setup @omnify alias in config files
  const omnifyPath = getOmnifyTypescriptPath(projectRoot) || 'src/omnify';

  try {
    const updatedTsconfigs = setupTsconfigAlias(projectRoot, omnifyPath);
    for (const file of updatedTsconfigs) {
      results.push(`✓ Added @omnify alias to ${file}`);
    }
  } catch { /* ignore */ }

  try {
    if (setupViteAlias(projectRoot, omnifyPath)) {
      results.push(`✓ Added @omnify alias to vite.config`);
    }
  } catch { /* ignore */ }

  for (const r of results) console.log(`  ${r}`);
  console.log('\n✅ Setup complete! Run `npx omnify generate` to get started.\n');
}

main();
