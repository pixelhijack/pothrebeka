import fs from 'fs';
import path from 'path';
import loadMarkdownPages from './loadMarkdownPages.js';
import loadTemplates from './loadTemplates.js';
import renderPage from './renderPage.js';

/**
 * Build static HTML files into public/generated from markdown pages and templates.
 *
 * @param {Object} options
 * @param {string} options.projectDir
 * @param {string} options.workspaceRoot
 * @param {string} options.outputDir
 * @param {boolean} [options.cleanOutput=true]
 * @returns {{generatedPages: number, outputDir: string, generatedAt: string}}
 */
export default function buildGeneratedPages({
  projectDir,
  workspaceRoot,
  outputDir,
  cleanOutput = true,
}) {
  if (cleanOutput && fs.existsSync(outputDir)) {
    fs.rmSync(outputDir, { recursive: true, force: true });
  }

  fs.mkdirSync(outputDir, { recursive: true });

  const pages = loadMarkdownPages(projectDir, workspaceRoot);
  const templates = loadTemplates(projectDir);

  let generatedPages = 0;

  for (const page of pages) {
    const html = renderPage(page, templates);
    const safeSlug = String(page.slug || '')
      .split('/')
      .filter(Boolean)
      .filter(segment => segment !== '.' && segment !== '..')
      .join('/');

    const targetPath = safeSlug === ''
      ? path.join(outputDir, 'index.html')
      : path.join(outputDir, safeSlug, 'index.html');

    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, html, 'utf8');
    generatedPages += 1;
  }

  const generatedAt = new Date().toISOString();
  fs.writeFileSync(
    path.join(outputDir, '_meta.json'),
    JSON.stringify({ generatedPages, generatedAt }, null, 2),
    'utf8'
  );

  return {
    generatedPages,
    outputDir,
    generatedAt,
  };
}
