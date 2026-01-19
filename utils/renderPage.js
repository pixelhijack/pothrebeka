/**
 * Render a complete HTML page with master template
 * 
 * @param {Object} page - Page object with html and metadata
 * @param {Object} templates - Templates object from loadTemplates
 * @returns {string} Complete HTML document
 */
export default function renderPage(page, templates) {
  const templateName = page.template || 'homeWithTopNav';
  const template = templates[templateName];
  
  if (!template) {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Template Not Found</title>
</head>
<body>
  <h1>Template "${templateName}" not found</h1>
  <div>${page.html}</div>
</body>
</html>`;
  }
  
  // Start with the template HTML
  let html = template.html;
  
  // Replace {{main}} with the page content
  html = html.replace(/\{\{main\}\}/g, page.html);
  
  // Replace {{title}} with page title
  html = html.replace(/\{\{title\}\}/g, page.title || 'Page');
  
  // Replace {{navColorClass}} with appropriate classes
  const navColorClass = page.navColor === 'black' 
    ? 'bg-black text-white' 
    : 'bg-white text-black';
  html = html.replace(/\{\{navColorClass\}\}/g, navColorClass);
  
  // Replace {{mainClass}} with page's mainClass
  const mainClass = page.mainClass || 'p-8';
  html = html.replace(/\{\{mainClass\}\}/g, mainClass);
  
  // Replace {{backgroundStyle}} with background style attribute
  const backgroundStyle = page.background 
    ? `style="background-image: url('${page.background}');"` 
    : '';
  html = html.replace(/\{\{backgroundStyle\}\}/g, backgroundStyle);
  
  return html;
}
