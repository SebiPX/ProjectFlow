const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /\bbg-gray-900\b/g, replacement: 'bg-background' },
  { regex: /\bbg-gray-800\b/g, replacement: 'bg-card' },
  { regex: /\bbg-gray-700\b/g, replacement: 'bg-muted' },
  { regex: /\bbg-gray-600\b/g, replacement: 'bg-muted/80' },
  { regex: /\bborder-gray-800\b/g, replacement: 'border-border' },
  { regex: /\bborder-gray-700\b/g, replacement: 'border-border' },
  { regex: /\bborder-gray-600\b/g, replacement: 'border-input' },
  { regex: /\btext-white\b/g, replacement: 'text-foreground' },
  { regex: /\btext-gray-200\b/g, replacement: 'text-foreground' },
  { regex: /\btext-gray-300\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-gray-400\b/g, replacement: 'text-muted-foreground' },
  { regex: /\btext-gray-500\b/g, replacement: 'text-muted-foreground' },
  { regex: /\bbg-blue-600\b/g, replacement: 'bg-primary' },
  { regex: /\bbg-blue-500\b/g, replacement: 'bg-primary' },
  { regex: /\btext-blue-600\b/g, replacement: 'text-primary' },
  { regex: /\btext-blue-500\b/g, replacement: 'text-primary' },
  { regex: /\btext-blue-400\b/g, replacement: 'text-primary' },
  { regex: /\bhover:bg-blue-700\b/g, replacement: 'hover:bg-primary/90' },
  { regex: /\bhover:bg-gray-700\b/g, replacement: 'hover:bg-muted' },
  { regex: /\bhover:bg-gray-600\b/g, replacement: 'hover:bg-muted/80' },
  { regex: /\bhover:text-white\b/g, replacement: 'hover:text-foreground' },
  { regex: /\bring-blue-500\b/g, replacement: 'ring-primary' },
  { regex: /\bborder-blue-500\b/g, replacement: 'border-primary' },
  { regex: /\bfocus:border-blue-500\b/g, replacement: 'focus:border-primary' },
  { regex: /\bfocus:ring-blue-500\b/g, replacement: 'focus:ring-primary' },
  { regex: /\bbg-gray-900\/50\b/g, replacement: 'bg-background/50' },
  { regex: /\bbg-gray-800\/50\b/g, replacement: 'bg-card/50' },
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
      
      // Skip the index.css generated files or our already perfect ones if we want, but regex shouldn't hurt
      // Actually, skip index.tsx to avoid messing up imports, wait no it's fine.
      
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
