import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

// Configure marked to handle HTML properly
marked.setOptions({
  breaks: true,        // Convert \n to <br>
  gfm: true,          // GitHub Flavored Markdown
  headerIds: true,    // Add IDs to headers
  mangle: false,      // Don't escape email addresses
  pedantic: false,    // Don't be overly strict
  sanitize: false,    // Don't sanitize HTML (allow raw HTML)
});

/**
 * Recursively find all .md files in a directory
 * @param {string} dir - Directory to search
 * @param {string} baseDir - Base directory for calculating relative paths
 * @returns {Array} Array of { filePath, relativePath } objects
 */
function findMarkdownFiles(dir, baseDir) {
  const results = [];
  
  if (!fs.existsSync(dir)) {
    return results;
  }
  
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively search subdirectories
      results.push(...findMarkdownFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Calculate relative path from baseDir (this becomes the slug)
      const relativePath = path.relative(baseDir, fullPath);
      results.push({ filePath: fullPath, relativePath });
    }
  }
  
  return results;
}

/**
 * Process include directives in markdown content
 * Supports: {{include:'partial.md'}} or {{include:"partial.md"}}
 * Path resolution:
 * - Absolute paths (start with /): resolved from workspace root
 * - Relative paths: resolved relative to current file
 * 
 * Examples:
 * - {{include:'partial.md'}} → same directory as current file
 * - {{include:'../shared/header.md'}} → relative to current file
 * - {{include:'/books/snippets/intro.md'}} → from workspace root
 * - {{include:'/projects/write/pages/_partials/footer.md'}} → from workspace root
 * 
 * @param {string} content - Markdown content with potential includes
 * @param {string} currentFilePath - Path to the current file (for resolving relative includes)
 * @param {string} workspaceRoot - Path to workspace root (for resolving absolute includes)
 * @param {Set} processedFiles - Set of already processed files (to prevent circular includes)
 * @returns {string} Content with includes resolved
 */
function processIncludes(content, currentFilePath, workspaceRoot, processedFiles = new Set()) {
  // Prevent circular includes
  if (processedFiles.has(currentFilePath)) {
    console.warn(`Circular include detected: ${currentFilePath}`);
    return content;
  }
  
  processedFiles.add(currentFilePath);
  
  // Match {{include:'file.md'}} or {{include:"file.md"}}
  const includePattern = /\{\{include:['"]([^'"]+)['"]\}\}/g;
  
  return content.replace(includePattern, (match, includePath) => {
    let resolvedPath;
    
    // Absolute path (starts with /) - resolve from workspace root
    if (includePath.startsWith('/')) {
      resolvedPath = path.join(workspaceRoot, includePath);
    } else {
      // Relative path - resolve from current file directory
      const currentDir = path.dirname(currentFilePath);
      resolvedPath = path.join(currentDir, includePath);
    }
    
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`Include file not found: ${includePath} (resolved: ${resolvedPath})`);
      return `<!-- Include not found: ${includePath} -->`;
    }
    
    try {
      let includeContent = fs.readFileSync(resolvedPath, 'utf8');
      
      // If the included file has frontmatter, strip it (only use content)
      if (includeContent.startsWith('---')) {
        const parsed = matter(includeContent);
        includeContent = parsed.content;
      }
      
      // Recursively process includes in the included file
      return processIncludes(includeContent, resolvedPath, workspaceRoot, processedFiles);
    } catch (error) {
      console.error(`Error reading include file ${includePath}:`, error.message);
      return `<!-- Error including: ${includePath} -->`;
    }
  });
}

/**
 * Load and parse markdown pages from a project's pages/ folder
 * Returns array of page objects compatible with manifest.json pages
 * 
 * Note: HTML elements in markdown must be flush-left (no indentation)
 * to be properly rendered. Some elements like <form> are particularly
 * sensitive to indentation and will be treated as code blocks if indented.
 * 
 * @param {string} projectDir - Path to the project directory
 * @param {string} workspaceRoot - Path to workspace root (for absolute includes)
 * @returns {Array} Array of page objects with slug, html, and frontmatter metadata
 */
export default function loadMarkdownPages(projectDir, workspaceRoot) {
  const pagesDir = path.join(projectDir, 'pages');
  
  // If pages directory doesn't exist, return empty array
  if (!fs.existsSync(pagesDir)) {
    return [];
  }
  
  // Recursively find all .md files
  const mdFiles = findMarkdownFiles(pagesDir, pagesDir);
  
  return mdFiles.map(({ filePath, relativePath }) => {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    
    // Parse frontmatter and markdown content
    const { data, content } = matter(fileContent);
    
    // Process includes ({{include:'partial.md'}})
    const contentWithIncludes = processIncludes(content, filePath, workspaceRoot);
    
    // Convert markdown to HTML
    const html = marked.parse(contentWithIncludes);
    
    // Build slug from file path (remove .md extension, normalize separators)
    // e.g., "subroute/subpage.md" → "subroute/subpage"
    const defaultSlug = relativePath.replace(/\.md$/, '').replace(/\\/g, '/');
    const defaultTitle = path.basename(relativePath, '.md');

    // Build page object compatible with manifest.json structure
    // Spread all frontmatter properties, then override with specific handling
    // This allows any custom properties (mainClass, etc.) to be preserved
    return {
      ...data, // Spread all frontmatter properties first
      slug: data.slug !== undefined ? data.slug : defaultSlug, // Use frontmatter slug if defined (even if empty)
      template: data.template || 'homeWithTopNav', // Default template if not specified
      title: data.title || defaultTitle, // Default title if not specified
      navColor: data.navColor || 'black', // Default navColor if not specified
      html: html, // ← This is the key: pre-rendered HTML, not a tree
      mainClass: "pt-[75px] m-0",
      _source: 'markdown' // Internal marker to track where this page came from
    };
  });
}
