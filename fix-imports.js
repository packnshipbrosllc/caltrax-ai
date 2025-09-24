#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const legacyDir = path.join(__dirname, 'src/components/legacy');

// Function to fix imports in a file
function fixImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Fix common import patterns
  const replacements = [
    // Utils imports
    { from: /from '\.\.\/utils\/security'/g, to: "from '../../lib/security'" },
    { from: /from '\.\.\/utils\/simpleStorage'/g, to: "from '../../lib/simpleStorage'" },
    { from: /from '\.\.\/utils\/macroStorage'/g, to: "from '../../lib/macroStorage'" },
    { from: /from '\.\.\/utils\/userLogger'/g, to: "from '../../lib/userLogger'" },
    
    // Services imports
    { from: /from '\.\.\/services\/authService'/g, to: "from '../../services/authService'" },
    
    // Config imports
    { from: /from '\.\.\/config\/stripe'/g, to: "from '../../config/stripe'" },
    
    // UI imports
    { from: /from '\.\.\/ui\//g, to: "from '../ui/" },
    { from: /from '\.\/ui\//g, to: "from '../ui/" },
  ];
  
  replacements.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed imports in ${path.basename(filePath)}`);
}

// Get all JSX/TSX files in legacy directory
function getAllFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath));
    } else if (item.endsWith('.jsx') || item.endsWith('.tsx') || item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Fix all files
const files = getAllFiles(legacyDir);
files.forEach(fixImports);

console.log(`Fixed imports in ${files.length} files`);
