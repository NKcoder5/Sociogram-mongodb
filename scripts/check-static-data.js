#!/usr/bin/env node

/**
 * Static Data Detection Script
 * Scans frontend components for hardcoded data patterns and fails CI if found
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const FRONTEND_SRC_PATH = path.join(__dirname, '../frontend/src');
const ALLOWED_STATIC_PATTERNS = [
  // Navigation menu items are allowed
  'menuItems',
  // Icon imports are allowed
  'Icon',
  // Route definitions are allowed
  'routes',
  // Component prop types are allowed
  'PropTypes',
  // Tailwind classes are allowed
  'className',
  // Event handlers are allowed
  'handle',
  // State setters are allowed
  'set'
];

// Patterns that indicate static/mock data
const STATIC_DATA_PATTERNS = [
  // Mock data arrays
  /const\s+\w*[Dd]ata\s*=\s*\[/g,
  /const\s+mock\w*\s*=\s*\[/g,
  /const\s+dummy\w*\s*=\s*\[/g,
  /const\s+sample\w*\s*=\s*\[/g,
  /const\s+placeholder\w*\s*=\s*\[/g,

  // Hardcoded object arrays
  /\[\s*\{\s*id:\s*\d+/g,
  /\[\s*\{\s*username:\s*['"`]/g,
  /\[\s*\{\s*name:\s*['"`]/g,
  /\[\s*\{\s*title:\s*['"`]/g,

  // Mock API responses
  /Mock\s+\w+\s+data/gi,
  /demo\s+purposes/gi,
  /placeholder\s+data/gi,
  /sample\s+data/gi,

  // Hardcoded URLs (except for legitimate external resources)
  /https:\/\/picsum\.photos/g,
  /https:\/\/via\.placeholder/g,
  /https:\/\/placehold/g,

  // Lorem ipsum and test content
  /lorem\s+ipsum/gi,
  /test\s+content/gi,
  /example\s+content/gi,

  // Hardcoded user data
  /john_doe|jane_smith|alex_wilson/gi,
  /test@example\.com/g,
  /password123/g,

  // Static follower counts
  /\d+\s+followers/g,
  /\d+\s+following/g,
  /\d+\s+posts/g,

  // Hardcoded timestamps (use word boundaries to avoid SVG path matches like 12h)
  /\b(2h|3h|1d|2d)\b/g,

  // Static hashtags in arrays
  /#photography|#travel|#food/g
];

// Files to exclude from checks
const EXCLUDED_FILES = [
  'test',
  'spec',
  'stories',
  '__tests__',
  '.test.',
  '.spec.',
  'mock',
  'fixture'
];

// Directories to exclude
const EXCLUDED_DIRS = [
  'node_modules',
  '.git',
  'dist',
  'build',
  '__tests__',
  'tests',
  'test'
];

class StaticDataChecker {
  constructor() {
    this.violations = [];
    this.scannedFiles = 0;
  }

  shouldExcludeFile(filePath) {
    const fileName = path.basename(filePath).toLowerCase();
    return EXCLUDED_FILES.some(excluded => fileName.includes(excluded));
  }

  shouldExcludeDir(dirPath) {
    const dirName = path.basename(dirPath).toLowerCase();
    return EXCLUDED_DIRS.some(excluded => dirName.includes(excluded));
  }

  isAllowedPattern(match, context) {
    return ALLOWED_STATIC_PATTERNS.some(allowed =>
      context.toLowerCase().includes(allowed.toLowerCase())
    );
  }

  scanFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(FRONTEND_SRC_PATH, filePath);

      this.scannedFiles++;

      STATIC_DATA_PATTERNS.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(content)) !== null) {
          const lineNumber = content.substring(0, match.index).split('\n').length;
          const line = content.split('\n')[lineNumber - 1];
          const lowerLine = line.toLowerCase();

          // Skip if it's an allowed pattern
          if (this.isAllowedPattern(match[0], line)) {
            continue;
          }

          // EXTREME FALSE POSITIVES PATCH:
          // 1. Ignore matches inside SVG path tags or 'd' attributes
          if ((lowerLine.includes('<path') || lowerLine.includes('d="')) && (lowerLine.includes('m') || lowerLine.includes('l') || lowerLine.includes('z'))) {
            continue;
          }
          // 2. Ignore matches in getContext('2d')
          if (lowerLine.includes("getcontext('2d')") || lowerLine.includes('getcontext("2d")')) {
            continue;
          }
          // 3. Ignore CSS rotate(-2deg)
          if (lowerLine.includes('rotate(') && lowerLine.includes('deg)')) {
            continue;
          }
          // 4. Ignore Heroicons and other icon libraries
          if (lowerLine.includes('icon') && lowerLine.includes('classname')) {
            continue;
          }

          this.violations.push({
            file: relativePath,
            line: lineNumber,
            pattern: match[0],
            context: line.trim(),
            patternIndex: index
          });
        }
        // Reset regex lastIndex to avoid issues with global flags
        pattern.lastIndex = 0;
      });
    } catch (error) {
      console.error(`Error scanning file ${filePath}:`, error.message);
    }
  }

  scanDirectory(dirPath) {
    try {
      const items = fs.readdirSync(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stat = fs.statSync(itemPath);

        if (stat.isDirectory()) {
          if (!this.shouldExcludeDir(itemPath)) {
            this.scanDirectory(itemPath);
          }
        } else if (stat.isFile()) {
          const ext = path.extname(item).toLowerCase();
          if (['.js', '.jsx', '.ts', '.tsx'].includes(ext) && !this.shouldExcludeFile(itemPath)) {
            this.scanFile(itemPath);
          }
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  generateReport() {
    console.log('\n🔍 Static Data Detection Report');
    console.log('================================');
    console.log(`📁 Scanned ${this.scannedFiles} files`);
    console.log(`⚠️  Found ${this.violations.length} violations\n`);

    if (this.violations.length === 0) {
      console.log('✅ No static data violations found!');
      return true;
    }

    // Group violations by file
    const violationsByFile = this.violations.reduce((acc, violation) => {
      if (!acc[violation.file]) {
        acc[violation.file] = [];
      }
      acc[violation.file].push(violation);
      return acc;
    }, {});

    Object.entries(violationsByFile).forEach(([file, violations]) => {
      console.log(`❌ ${file}`);
      violations.forEach(violation => {
        console.log(`   Line ${violation.line}: ${violation.pattern}`);
        console.log(`   Context: ${violation.context}`);
        console.log('');
      });
    });

    console.log('\n📋 Remediation Guidelines:');
    console.log('- Replace hardcoded arrays with API calls');
    console.log('- Use dynamic data from database/context');
    console.log('- Remove mock/placeholder data');
    console.log('- Implement proper loading states');
    console.log('- Use environment-specific configurations');

    return false;
  }

  run() {
    console.log('🚀 Starting static data detection...');
    console.log(`📂 Scanning: ${FRONTEND_SRC_PATH}`);

    if (!fs.existsSync(FRONTEND_SRC_PATH)) {
      console.error(`❌ Frontend source path not found: ${FRONTEND_SRC_PATH}`);
      process.exit(1);
    }

    this.scanDirectory(FRONTEND_SRC_PATH);
    const passed = this.generateReport();

    // Save report to file for easy reading
    const reportData = JSON.stringify(this.violations, null, 2);
    fs.writeFileSync(path.join(process.cwd(), 'violations_debug.json'), reportData);

    if (!passed) {
      console.log('\n💥 CI Check Failed: Static data violations found!');
      process.exit(1);
    }

    console.log('\n✅ CI Check Passed: No static data violations!');
    process.exit(0);
  }
}

// Run the checker
const checker = new StaticDataChecker();
checker.run();
