#!/usr/bin/env node
const { ESLint } = require('eslint');
const fs = require('node:fs');
const path = require('node:path');

const maxWarnings = Number(process.env.ESLINT_MAX_WARNINGS ?? 10);
const maxErrors = Number(process.env.ESLINT_MAX_ERRORS ?? 5);
const candidateDirs = ['src', 'apps', 'libs', 'test'];

const lintGlobs = candidateDirs
  .filter((dir) => fs.existsSync(path.resolve(process.cwd(), dir)))
  .map((dir) => `${dir}/**/*.ts`);

function getModuleName(filePath) {
  const normalized = filePath.replace(/\\/g, '/');
  const srcIndex = normalized.indexOf('/src/');
  if (srcIndex === -1) return 'root';
  const afterSrc = normalized.slice(srcIndex + 5);
  const moduleName = afterSrc.split('/')[0];
  return moduleName || 'root';
}

async function main() {
  const eslint = new ESLint();
  const results = await eslint.lintFiles(lintGlobs);

  const moduleStats = new Map();

  for (const fileResult of results) {
    const moduleName = getModuleName(fileResult.filePath || '');
    if (!moduleStats.has(moduleName)) {
      moduleStats.set(moduleName, { warnings: 0, errors: 0 });
    }

    const stats = moduleStats.get(moduleName);
    stats.warnings += fileResult.warningCount || 0;
    stats.errors += fileResult.errorCount || 0;
  }

  let hasViolation = false;
  console.log(
    `ESLint threshold check (per module): max ${maxWarnings} warnings, max ${maxErrors} errors`,
  );

  for (const [moduleName, stats] of moduleStats.entries()) {
    const exceeds = stats.warnings > maxWarnings || stats.errors > maxErrors;
    const status = exceeds ? 'FAIL' : 'OK';
    console.log(
      `- ${moduleName}: ${stats.warnings} warnings, ${stats.errors} errors [${status}]`,
    );
    if (exceeds) hasViolation = true;
  }

  if (hasViolation) {
    console.error('ESLint threshold check failed.');
    process.exit(1);
  }

  console.log('ESLint threshold check passed.');
}

main().catch((error) => {
  console.error('Failed to run ESLint threshold check:', error);
  process.exit(1);
});
