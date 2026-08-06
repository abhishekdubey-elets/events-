/**
 * Lifts the speaker roster out of the theme's speakers.html into typed data,
 * so /speakers/[slug] can be a real route with real metadata instead of a
 * dozen copies of one static page.
 *
 * Run:  node tools/extract-data.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'node-html-parser';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = readFileSync(resolve(ROOT, '_theme-source/elets-theme/build/content/speakers.html'), 'utf8');
const root = parse(html);

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/\b(shri|smt|dr|prof|brig|mr|ms|mrs|ias|ips|irs)\b\.?/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const seen = new Set();
const speakers = root.querySelectorAll('article.speaker').map((el) => {
  const name = el.querySelector('.speaker__info h3 a')?.text.trim() || '';
  const paras = el.querySelectorAll('.speaker__info p').map((p) => p.text.trim().replace(/\s+/g, ' '));
  const img = el.querySelector('img')?.getAttribute('src') || '';
  const alt = el.querySelector('img')?.getAttribute('alt') || name;
  const badges = el.querySelectorAll('.speaker__badges .tag').map((t) => t.text.trim());
  let slug = slugify(name);
  while (seen.has(slug)) slug += '-2';
  seen.add(slug);
  return {
    slug,
    name,
    role: paras[0] || '',
    org: paras[1] || '',
    image: '/' + img.replace(/^\.?\//, ''),
    alt,
    badges,
    cats: (el.getAttribute('data-cat') || '').split(' ').filter(Boolean),
    searchText: el.getAttribute('data-search-text') || `${name} ${paras.join(' ')}`,
  };
});

mkdirSync(resolve(ROOT, 'src/data'), { recursive: true });
writeFileSync(
  resolve(ROOT, 'src/data/speakers.generated.json'),
  JSON.stringify(speakers, null, 2) + '\n'
);
console.log(`✓ ${speakers.length} speakers → src/data/speakers.generated.json`);
