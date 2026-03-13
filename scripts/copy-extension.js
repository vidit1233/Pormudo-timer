import { copyFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const dist = join(root, 'dist');

if (!existsSync(dist)) {
  console.error('Run "npm run build" first.');
  process.exit(1);
}

copyFileSync(join(root, 'manifest.json'), join(dist, 'manifest.json'));
console.log('Chrome extension files ready in dist/');
console.log('Load the "dist" folder as an unpacked extension in Chrome.');
