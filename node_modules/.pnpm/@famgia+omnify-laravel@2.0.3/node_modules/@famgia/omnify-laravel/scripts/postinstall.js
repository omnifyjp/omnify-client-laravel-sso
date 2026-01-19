#!/usr/bin/env node

/**
 * @famgia/omnify-laravel postinstall
 * Copies Laravel AI guides to .claude/omnify/
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function main() {
  // Skip in CI
  if (process.env.CI || process.env.CONTINUOUS_INTEGRATION) {
    return;
  }

  // Skip in monorepo source (but allow examples/)
  const projectDir = process.env.INIT_CWD || process.cwd();
  if (projectDir.includes('omnify-ts') && !projectDir.includes('omnify-ts/examples')) {
    return;
  }

  // Find project root
  let dir = projectDir;
  const nodeModulesIndex = dir.indexOf('node_modules');
  if (nodeModulesIndex !== -1) {
    dir = dir.substring(0, nodeModulesIndex - 1);
  }
  if (!fs.existsSync(path.join(dir, 'package.json'))) {
    return;
  }

  // Copy ai-guides to .claude/omnify/
  const omnifyDir = path.join(dir, '.claude', 'omnify');
  const aiGuidesDir = path.join(__dirname, '..', 'ai-guides');

  try {
    if (!fs.existsSync(omnifyDir)) {
      fs.mkdirSync(omnifyDir, { recursive: true });
    }

    if (fs.existsSync(aiGuidesDir)) {
      for (const file of fs.readdirSync(aiGuidesDir)) {
        const src = path.join(aiGuidesDir, file);
        const dest = path.join(omnifyDir, file);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
        }
      }
    }
  } catch {
    // Silent fail
  }
}

main();
