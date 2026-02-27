const fs = require('fs');
const path = require('path');

function stripComments(src) {
  let out = '';
  let i = 0;
  let inStr = null;
  let esc = false;
  let inLine = false;
  let inBlock = false;
  while (i < src.length) {
    const ch = src[i];
    const nxt = src[i + 1];

    if (inLine) {
      if (ch === '\n') {
        inLine = false;
        out += ch;
      }
      i++;
      continue;
    }
    if (inBlock) {
      if (ch === '*' && nxt === '/') {
        inBlock = false;
        i += 2;
      } else {
        i++;
      }
      continue;
    }

    if (!inStr) {
      if (ch === '/' && nxt === '/') { inLine = true; i += 2; continue; }
      if (ch === '/' && nxt === '*') { inBlock = true; i += 2; continue; }
      if (ch === '"' || ch === "'" || ch === '`') { inStr = ch; out += ch; i++; continue; }
      out += ch;
      i++;
    } else {
      if (esc) {
        out += ch; esc = false;
      } else if (ch === '\\') {
        out += ch; esc = true;
      } else if (ch === inStr) {
        inStr = null; out += ch;
      } else {
        out += ch;
      }
      i++;
    }
  }
  return out;
}

function walk(dir) {
  const extOK = new Set(['.ts', '.tsx', '.js', '.jsx']);
  const skipDirs = new Set(['node_modules', '.expo', 'android', 'ios', 'scripts']);
  function visit(p) {
    const stat = fs.statSync(p);
    if (stat.isDirectory()) {
      if (skipDirs.has(path.basename(p))) return;
      for (const name of fs.readdirSync(p)) visit(path.join(p, name));
    } else {
      const ext = path.extname(p);
      if (extOK.has(ext)) {
        const code = fs.readFileSync(p, 'utf8');
        const stripped = stripComments(code);
        if (code !== stripped) {
          fs.writeFileSync(p, stripped, 'utf8');
          console.log('stripped:', p);
        }
      }
    }
  }
  visit(dir);
}

const root = path.resolve(__dirname, '..');
console.log('Stripping comments in', root);
walk(root);
console.log('Done');
