const fs = require('fs');
const path = require('path');

const prefixes = ['gray', 'slate', 'zinc', 'neutral', 'stone'];

let replacements = [
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-900\\b`, 'g'), replacement: 'bg-background' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-800\\b`, 'g'), replacement: 'bg-card' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-700\\b`, 'g'), replacement: 'bg-muted' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-600\\b`, 'g'), replacement: 'bg-muted/80' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bborder-${p}-800\\b`, 'g'), replacement: 'border-border' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bborder-${p}-700\\b`, 'g'), replacement: 'border-border' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bborder-${p}-600\\b`, 'g'), replacement: 'border-input' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\btext-${p}-100\\b`, 'g'), replacement: 'text-foreground' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\btext-${p}-200\\b`, 'g'), replacement: 'text-foreground' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\btext-${p}-300\\b`, 'g'), replacement: 'text-muted-foreground' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\btext-${p}-400\\b`, 'g'), replacement: 'text-muted-foreground' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\btext-${p}-500\\b`, 'g'), replacement: 'text-muted-foreground' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bhover:bg-${p}-700\\b`, 'g'), replacement: 'hover:bg-muted' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bhover:bg-${p}-600\\b`, 'g'), replacement: 'hover:bg-muted/80' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-900\\/50\\b`, 'g'), replacement: 'bg-background/50' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-800\\/50\\b`, 'g'), replacement: 'bg-card/50' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-800\\/60\\b`, 'g'), replacement: 'bg-card/60' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-800\\/80\\b`, 'g'), replacement: 'bg-card/80' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bbg-${p}-900\\/40\\b`, 'g'), replacement: 'bg-background/40' })),
  ...prefixes.map(p => ({ regex: new RegExp(`\\bborder-${p}-700\\/50\\b`, 'g'), replacement: 'border-border/50' })),
  
  // Custom HEX strings seen in NewsWidget and other components
  { regex: /text-\[\#135bec\]/g, replacement: 'text-primary' },
  { regex: /bg-\[\#135bec\]/g, replacement: 'bg-primary' },
  { regex: /border-\[\#135bec\]/g, replacement: 'border-primary' },
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      for (const r of replacements) {
        content = content.replace(r.regex, r.replacement);
      }
      if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Updated: ${filePath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'components'));

console.log("Refactoring complete.");
