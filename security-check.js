#!/usr/bin/env node

/**
 * Script to check for sensitive files that should not be committed
 * Run this before committing or as part of a pre-commit hook
 */

import fs from 'fs';
import { execSync } from 'child_process';

// Files that should never be committed
const SENSITIVE_FILES = [
  '.env',
  '.env.local',
  '.env.development',
  '.env.production',
  '.env.test',
  'credentials.json',
  'secrets.json',
  'token.json',
  'keys.json',
  '*.pem',
  '*.key',
  '*.crt',
  '*.pfx',
  '*.p12'
];

console.log('Running security check...');

// Check for sensitive files in the git working directory
let filesFound = false;

for (const pattern of SENSITIVE_FILES) {
  // Skip glob patterns
  if (pattern.includes('*')) continue;
  
  // Check if file exists and is not ignored by git
  if (fs.existsSync(pattern)) {
    try {
      // Check if file is already ignored by git
      execSync(`git check-ignore -q ${pattern}`);
    } catch (error) {
      // File exists and is not ignored
      console.error(`❌ Error: Sensitive file "${pattern}" found and is not ignored by git.`);
      filesFound = true;
    }
  }
}

// Check for pattern matches (like *.pem files)
try {
  const allFiles = execSync('git ls-files').toString().split('\n').filter(Boolean);
  
  for (const file of allFiles) {
    for (const pattern of SENSITIVE_FILES) {
      if (pattern.includes('*')) {
        const regex = new RegExp(pattern.replace('.', '\\.').replace('*', '.*'));
        if (regex.test(file)) {
          console.error(`❌ Error: Sensitive file "${file}" matching pattern "${pattern}" is tracked by git.`);
          filesFound = true;
        }
      }
    }
  }
} catch (error) {
  console.error('❌ Error checking git files:', error.message);
}

if (filesFound) {
  console.error('❌ Security check failed. Please remove the sensitive files or add them to .gitignore.');
  process.exit(1);
} else {
  console.log('✅ Security check passed. No sensitive files detected.');
  process.exit(0);
} 