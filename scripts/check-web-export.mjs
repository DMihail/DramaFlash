// Fails the web export when the bundle was built as the development variant.
// A development bundle enables the /dev reset routes and the Profile reset row.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = 'dist/client/_expo/static/js/web';
const files = readdirSync(root).filter((name) => name.endsWith('.js'));
const variants = new Set();

for (const name of files) {
  const source = readFileSync(join(root, name), 'utf8');
  for (const match of source.matchAll(/appVariant\\*"\s*:\s*\\*"(\w+)/g)) {
    variants.add(match[1]);
  }
}

if (variants.size !== 1 || !variants.has('production')) {
  const found = variants.size === 0 ? 'none' : [...variants].join(', ');
  console.error(`Web export must be the production variant. Found: ${found}.`);
  process.exit(1);
}

console.log(`Web export checked: production variant in ${files.length} bundles.`);
