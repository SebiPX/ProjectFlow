const fs = require('fs');
const path = require('path');

function processClasses(classes) {
  let newClasses = classes;
  
  // bg-primary
  if (/\bbg-primary\b/.test(newClasses) && !/\btext-primary-foreground\b/.test(newClasses)) {
    if (/\btext-foreground\b/.test(newClasses)) {
      newClasses = newClasses.replace(/\btext-foreground\b/g, 'text-primary-foreground');
    } else if (/\btext-muted-foreground\b/.test(newClasses)) {
      newClasses = newClasses.replace(/\btext-muted-foreground\b/g, 'text-primary-foreground');
    } else if (!/\btext-[a-z]+(-[a-z0-9]+)*\b/.test(newClasses) || /\btext-center\b/.test(newClasses) || /\btext-[smlx2-9]/.test(newClasses)) {
      // If there's no text-color specified (only things like text-center or text-sm), append text-primary-foreground
      // To be safe, let's just replace all instances or append
      // If it doesn't have ANY text color class (black, white, slate, primary, foreground, muted, destructive), we append.
      if (!/\btext-(primary|foreground|muted|destructive|secondary|white|black|slate|gray|blue)\b/.test(newClasses)) {
        newClasses += ' text-primary-foreground';
      }
    }
  }

  // hover:bg-primary
  if (/\bhover:bg-primary(?!(\/|-[a-z]))\b/.test(newClasses) && !/\bhover:text-primary-foreground\b/.test(newClasses)) {
    if (/\bhover:text-foreground\b/.test(newClasses)) {
      newClasses = newClasses.replace(/\bhover:text-foreground\b/g, 'hover:text-primary-foreground');
    } else if (/\bhover:text-muted-foreground\b/.test(newClasses)) {
      newClasses = newClasses.replace(/\bhover:text-muted-foreground\b/g, 'hover:text-primary-foreground');
    } else {
      if (!/\bhover:text-(primary|white|black|slate|gray|blue)\b/.test(newClasses)) {
         newClasses += ' hover:text-primary-foreground';
      }
    }
  }

  return newClasses;
}

function fixContrast(content) {
  // className="abc" or className='abc'
  let res = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classes) => {
    return `className=${quote}${processClasses(classes)}${quote}`;
  });

  // className={`abc`}
  res = res.replace(/className=\{`([\s\S]*?)`\}/g, (match, classes) => {
    return `className={\`${processClasses(classes)}\`}`;
  });
  
  // Custom checks for arrays in className if any, but regex is usually enough for most.
  return res;
}

function processDirectory(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      processDirectory(filePath);
    } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      let original = content;
      
      content = fixContrast(content);
      
      if (content !== original) {
        fs.writeFileSync(filePath, content);
        console.log(`Fixed contrast in: ${filePath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'components'));
processDirectory(path.join(__dirname, 'pages'));

console.log("Contrast fix complete.");
