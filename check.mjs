import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDemo } from './demo.js';

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, 'index.html'), 'utf8');
const catalog = JSON.parse(readFileSync(join(root, 'catalog.json'), 'utf8'));
const client = readFileSync(join(root, 'app.js'), 'utf8');
const ids = new Set(catalog.apps.map((app) => app.id));

assert.match(html, /<title>maxAI<\/title>/);
assert.match(html, /https:\/\/st\.max\.ru\/js\/max-web-app\.js/);
assert.doesNotMatch(html, /user-scalable=no|maximum-scale=1/);
assert.match(html, /viewport-fit=cover/);
assert.ok(ids.has('create-image') && ids.has('cinema-video') && ids.has('music'));
assert.ok(catalog.apps.length >= 100);
assert.equal(catalog.apps.some((app) => app.id.startsWith('smoke')), false);
assert.match(client, /Демонстрация\. Модель не подключена\./);
assert.doesNotMatch(client, /fetch\(|sk-|api\.openai|8188/);

const image = catalog.apps.find((app) => app.id === 'create-image');
assert.equal(buildDemo(image, { prompt: '' }).ok, false);
const ready = buildDemo(image, { prompt: 'ночная улица' });
assert.equal(ready.ok, true);
assert.equal(ready.message, 'Демонстрация. Модель не подключена.');
assert.match(ready.plate, /^assets\/plate-[a-d]\.jpg$/);

console.log(`maxai ok: ${catalog.apps.length} apps`);
