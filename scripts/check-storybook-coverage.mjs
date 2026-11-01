import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

async function sources(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return sources(file);
    return file.endsWith('.tsx') && !file.includes('.test.') ? [file.replaceAll('\\', '/').replace(/^src\//, '')] : [];
  }));
  return nested.flat();
}

const modules = (await Promise.all([sources('src/components'), sources('src/pages')])).flat();
const storyFiles = (await readdir('.storybook/stories')).filter((file) => file.endsWith('.stories.js'));
const stories = await Promise.all(storyFiles.map((file) => readFile(path.join('.storybook/stories', file), 'utf8')));
const coverage = new Set(stories.flatMap((story) => [...story.matchAll(/sourceFiles:\s*\[([^\]]+)\]/g)].flatMap((match) => [...match[1].matchAll(/['"]((?:components|pages)\/[^'"]+\.tsx)['"]/g)].map((value) => value[1]))));
const missing = modules.filter((file) => !coverage.has(file));
if (missing.length) {
  throw new Error(`Missing Storybook coverage:\n${missing.join('\n')}`);
}
console.log(`Storybook covers all ${modules.length} component/page modules in ${storyFiles.length} story files.`);
