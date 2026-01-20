import express from 'express'; 
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url'; 
import loadMarkdownPages from './utils/loadMarkdownPages.js';
import loadTemplates from './utils/loadTemplates.js';
import renderPage from './utils/renderPage.js';

// --- Define ES Module Equivalents for CommonJS __dirname previously ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const app = express();
const port = process.env.PORT || 3000;

console.log("Starting Express server...");

// Load markdown pages and templates on startup
const projectDir = path.join(__dirname, 'projects/main');
const workspaceRoot = __dirname;

let pages, templates, pagesMap;

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
}

// Initial load
loadContent();

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

// Serve static files from the "public" folder
app.use(express.static(path.join(__dirname, 'public'), { index: false }));
// serve project-specific static assets so /projects/* is reachable from the browser
app.use('/projects', express.static(path.join(__dirname, 'projects')));


app.get(/^(.*)$/, async (req, res) => {
  try {
    // Normalize the path - remove trailing slash and leading slash
    let slug = req.path.replace(/^\//, '').replace(/\/$/, '');
    
    // Empty slug means home page
    if (slug === '') {
      slug = '';
    }
    
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
