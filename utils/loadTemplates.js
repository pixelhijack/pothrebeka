import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { marked } from 'marked';

/**
 * Process include directives in template content
 * @param {string} content - Template content with potential includes
 * @param {string} templatesDir - Path to templates directory
 * @returns {string} Content with includes resolved
 */
function processTemplateIncludes(content, templatesDir) {
  // Match {{include:'file.md'}} or {{include:"file.md"}}
  const includePattern = /\{\{include:['"]([^'"]+)['"]\}\}/g;
  
  return content.replace(includePattern, (match, includePath) => {
    const resolvedPath = path.join(templatesDir, includePath);
    
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`Template include not found: ${includePath}`);
      return `<!-- Include not found: ${includePath} -->`;
    }
    
    try {
      let includeContent = fs.readFileSync(resolvedPath, 'utf8');
      
      // If the included file has frontmatter, strip it
      if (includeContent.startsWith('---')) {
        const parsed = matter(includeContent);
        includeContent = parsed.content;
      }
      
      // Convert markdown to HTML for the include
      return marked.parse(includeContent);
    } catch (error) {
      console.error(`Error reading template include ${includePath}:`, error.message);
      return `<!-- Error including: ${includePath} -->`;
    }
  });
}

/**
 * Load template markdown files and convert them to HTML
 * Templates are used as master layouts for pages
 * 
 * @param {string} projectDir - Path to the project directory
 * @returns {Object} Object with template names as keys and HTML content as values
 */
export default function loadTemplates(projectDir) {
  const templatesDir = path.join(projectDir, 'templates');
  const templates = {};
  
  if (!fs.existsSync(templatesDir)) {
    return templates;
  }
  
  const files = fs.readdirSync(templatesDir);
  
  for (const file of files) {
    if (file.endsWith('.md')) {
      const filePath = path.join(templatesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse frontmatter and content
      const { data, content } = matter(fileContent);
      
      // Process {{include:'partial.md'}} directives
      const contentWithIncludes = processTemplateIncludes(content, templatesDir);
      
      // Don't run markdown parser on templates - keep HTML as-is
      // (templates already contain HTML, and we need to preserve {{placeholders}})
      let html = contentWithIncludes;
      
      // Template name without extension
      const templateName = file.replace(/\.md$/, '');
      
      templates[templateName] = {
        html,
        metadata: data
      };
    }
  }
  
  return templates;
}
