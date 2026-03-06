import express from 'express'; 
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; 
import loadMarkdownPages from './utils/loadMarkdownPages.js';
import loadTemplates from './utils/loadTemplates.js';
import renderPage from './utils/renderPage.js';
import buildGeneratedPages from './utils/buildGeneratedPages.js';

// --- Define ES Module Equivalents for CommonJS __dirname previously ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

const CACHE_CONTROL_HEADER = 'public, s-maxage=86400, stale-while-revalidate=604800';
const NO_STORE_HEADER = 'private, no-store, max-age=0';
const CACHE_REFRESH_TOKEN = process.env.CACHE_REFRESH_TOKEN || '';
const VERCEL_DEPLOY_HOOK_URL = process.env.VERCEL_DEPLOY_HOOK_URL || '';

console.log("Starting Express server...");

// Load markdown pages and templates on startup
const projectDir = path.join(__dirname, 'projects/main');
const workspaceRoot = __dirname;
const publicDir = path.join(__dirname, 'public');
const generatedDir = path.join(publicDir, 'generated');

let pages, templates, pagesMap;
let contentLoaded = false;

function loadContent() {
  console.log("Loading markdown pages...");
  pages = loadMarkdownPages(projectDir, workspaceRoot);
  console.log(`Loaded ${pages.length} pages`);

  console.log("Loading templates...");
  templates = loadTemplates(projectDir);
  console.log(`Loaded ${Object.keys(templates).length} templates`);

  // Create a pages map for quick lookup by slug
  pagesMap = new Map();
  pages.forEach(page => {
    pagesMap.set(page.slug, page);
    console.log(`  - /${page.slug} (${page.template || 'default'})`);
  });

  contentLoaded = true;
}

function ensureDynamicContentLoaded() {
  if (!contentLoaded) {
    loadContent();
  }
}

function normalizeSlug(requestPath) {
  let slug = requestPath.replace(/^\//, '').replace(/\/$/, '');
  if (slug === '') return '';
  return slug
    .split('/')
    .filter(Boolean)
    .filter(segment => segment !== '.' && segment !== '..')
    .join('/');
}

function getGeneratedFilePath(slug) {
  const safeSlug = normalizeSlug(slug);
  if (safeSlug === '') {
    return path.join(generatedDir, 'index.html');
  }
  return path.join(generatedDir, safeSlug, 'index.html');
}

function isCacheBypassRequest(req) {
  if (req.path === '/__refresh-cache') {
    return true;
  }
  if (req.query?.v) {
    return true;
  }
  if (req.query?.nocache === '1') {
    return true;
  }
  if (req.cookies?.cache_bypass === '1') {
    return true;
  }
  return false;
}

async function handleManualRefresh(req, res) {
  const providedToken = req.get('x-refresh-token') || req.query.token || req.body?.token;

  if (!CACHE_REFRESH_TOKEN || providedToken !== CACHE_REFRESH_TOKEN) {
    res.setHeader('Cache-Control', NO_STORE_HEADER);
    return res.status(401).json({
      ok: false,
      message: 'Unauthorized. Provide valid refresh token.',
    });
  }

  let staticRegenerated = false;
  let deploymentTriggered = false;
  let deploymentError = null;

  try {
    loadContent();
  } catch (error) {
    console.error('Refresh: failed to reload markdown content', error);
  }

  try {
    const result = buildGeneratedPages({
      projectDir,
      workspaceRoot,
      outputDir: generatedDir,
      cleanOutput: true,
    });
    staticRegenerated = result.generatedPages >= 0;
  } catch (error) {
    // On Vercel production, filesystem can be read-only at runtime.
    console.warn('Refresh: static regeneration skipped/failed:', error.message);
  }

  if (VERCEL_DEPLOY_HOOK_URL) {
    try {
      const hookResponse = await fetch(VERCEL_DEPLOY_HOOK_URL, { method: 'POST' });
      deploymentTriggered = hookResponse.ok;
      if (!hookResponse.ok) {
        deploymentError = `Deploy hook returned ${hookResponse.status}`;
      }
    } catch (error) {
      deploymentError = error.message;
    }
  }

  const cacheBustVersion = Date.now().toString(36);
  res.cookie('cache_bypass', '1', {
    maxAge: 10 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
  });

  res.setHeader('Cache-Control', NO_STORE_HEADER);
  return res.status(200).json({
    ok: true,
    staticRegenerated,
    deploymentTriggered,
    deploymentError,
    cacheBustVersion,
    cacheBustQuery: `?v=${cacheBustVersion}`,
    note: 'Use the cacheBustQuery once to bypass CDN cache immediately for manual verification.',
  });
}

// Initial load
if (!isProduction) {
  loadContent();
}

// Watch for markdown file changes in development
if (process.env.NODE_ENV === 'development' || process.env.NODE_DEBUG === 'express') {
  const PROJECT = process.env.PROJECT_NAME || 'main';
  const projectDirWatch = path.join(__dirname, 'projects', PROJECT);
  const pagesDir = path.join(projectDirWatch, 'pages');
  const templatesDir = path.join(projectDirWatch, 'templates');
  
  // Watch pages directory recursively (markdown files)
  if (fs.existsSync(pagesDir)) {
    fs.watch(pagesDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        console.log(`📝 Markdown file changed: ${filename} - reloading...`);
        loadContent();
      }
    });
    console.log('📝 Watching for markdown changes in:', pagesDir);
  }
  
  // Watch templates directory
  if (fs.existsSync(templatesDir)) {
    fs.watch(templatesDir, { recursive: true }, (eventType, filename) => {
      if (filename && filename.endsWith('.md')) {
        console.log(`📝 Template changed: ${filename} - reloading...`);
        loadContent();
      }
    });
    console.log('📝 Watching for template changes in:', templatesDir);
  }
}

console.log("Starting Express server...");

// parse JSON and urlencoded bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    if (isCacheBypassRequest(req)) {
      res.setHeader('Cache-Control', NO_STORE_HEADER);
    } else {
      res.setHeader('Cache-Control', CACHE_CONTROL_HEADER);
    }
  }
  next();
});

app.get('/__refresh-cache', handleManualRefresh);
app.post('/__refresh-cache', handleManualRefresh);

// Serve static files from the "public" folder
app.use(express.static(publicDir, { index: false }));
// serve project-specific static assets so /projects/* is reachable from the browser
app.use('/projects', express.static(path.join(__dirname, 'projects')));


app.get(/^(.*)$/, async (req, res) => {
  try {
    const slug = normalizeSlug(req.path);

    // Prefer statically generated file first to minimize request-time CPU.
    const generatedFilePath = getGeneratedFilePath(slug);
    if (fs.existsSync(generatedFilePath) && !isCacheBypassRequest(req)) {
      return res.status(200).sendFile(generatedFilePath);
    }

    ensureDynamicContentLoaded();
    
    // Look up the page
    const page = pagesMap.get(slug);
    
    if (!page) {
      res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>404 - Page Not Found</title>
          <link rel="stylesheet" href="/css/styles.css">
        </head>
        <body class="flex items-center justify-center h-screen bg-gray-100">
          <div class="text-center">
            <h1 class="text-6xl font-bold text-gray-800">404</h1>
            <p class="text-xl text-gray-600 mt-4">Page not found: /${slug}</p>
            <a href="/" class="mt-8 inline-block px-6 py-3 bg-blue-500 text-white rounded hover:bg-blue-600">Go Home</a>
          </div>
        </body>
        </html>
      `);
      return;
    }
    
    // Render the page with the template
    const html = renderPage(page, templates);
    
    res.status(200).send(html);
  } catch (err) {
    console.error('Server render error', err);
    res.status(500).send('Server render error');
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
