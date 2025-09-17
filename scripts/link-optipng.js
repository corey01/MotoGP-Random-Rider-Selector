#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const moduleRoot = path.join(projectRoot, 'node_modules', 'optipng-bin');

if (!fs.existsSync(moduleRoot)) {
  console.log('optipng-bin is not installed; skipping optipng vendor copy.');
  process.exit(0);
}

const vendorDir = path.join(moduleRoot, 'vendor');
const destination = path.join(vendorDir, 'optipng');

const candidatePaths = [
  process.env.OPTIPNG_PATH,
  '/opt/homebrew/bin/optipng',
  '/usr/local/bin/optipng',
].filter(Boolean);

const sourcePath = candidatePaths.find((candidate) => fs.existsSync(candidate));

if (!sourcePath) {
  console.warn(
    'No optipng binary found. Install it with Homebrew (`brew install optipng`) or set OPTIPNG_PATH.'
  );
  process.exit(0);
}

fs.mkdirSync(vendorDir, { recursive: true });
fs.copyFileSync(sourcePath, destination);
fs.chmodSync(destination, 0o755);

console.log(`Copied optipng binary from ${sourcePath} to ${destination}.`);
