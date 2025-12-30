#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = process.cwd();
const srcDir = path.join(root, 'src');
const tmpDir = path.join(root, 'tmp_scss_check');
const outDir = path.join(root, 'tmp_scss_css_out');

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

try {
  if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
  if (fs.existsSync(outDir)) fs.rmSync(outDir, { recursive: true, force: true });

  fs.cpSync(srcDir, tmpDir, { recursive: true });

  const scssFiles = [];
  walk(tmpDir, (p) => { if (p.endsWith('.scss')) scssFiles.push(p); });

  for (const file of scssFiles) {
    const s = fs.readFileSync(file, 'utf8');
    const replaced = s.replace(/@\/styles\//g, 'styles/');
    if (replaced !== s) fs.writeFileSync(file, replaced, 'utf8');
  }

  console.log('Running: npx sass --no-source-map --load-path', tmpDir, `${tmpDir}:${outDir}`);
  const res = spawnSync('npx', ['sass', '--no-source-map', '--load-path', tmpDir, `${tmpDir}:${outDir}`], { stdio: 'inherit' });

  if (res.status !== 0) {
    console.error('Sass returned an error (see output above).');
    process.exit(res.status || 1);
  }

  fs.rmSync(tmpDir, { recursive: true, force: true });
  fs.rmSync(outDir, { recursive: true, force: true });

  console.log('✅ SCSS check passed');
  process.exit(0);
} catch (err) {
  console.error('Error running SCSS check:', err);
  process.exit(2);
}
