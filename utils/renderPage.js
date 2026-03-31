export function getImageSrcServer(filename) {
  if (!filename) return '';
  if (filename.startsWith('https://')) return filename;
  return `https://res.cloudinary.com/do78bvk8h/image/upload/f_auto,q_auto/${filename}`;
}

function replaceImageUrls(html) {
  // We still need this helper because chapter markdown is already converted
  // to raw HTML here, and image URLs can appear inside HTML attributes/styles.
  // Reuse the shared URL mapper to avoid duplicating Cloudinary logic.

  const resolveImagePath = (imagePath) => {
    if (!imagePath || imagePath.startsWith('http')) return imagePath;
    // Strip /img/ prefix if present, then pass to getImageSrcServer
    const cleanPath = imagePath.replace(/^\/img\//, '');
    return getImageSrcServer(cleanPath);
  };

  // Replace inline style background-image URLs
  html = html.replace(
    /url\(['"]?\/img\/([^'"\)]+)['"]?\)/gi,
    (match, imagePath) => {
      const resolved = resolveImagePath(`/img/${imagePath}`);
      return `url('${resolved}')`;
    }
  );
  
  // Replace img src attributes
  html = html.replace(
    /<img([^>]+)src=['"]?([^'"\s>]+)['"]?/gi,
    (match, beforeSrc, imagePath) => {
      const resolved = resolveImagePath(imagePath);
      return `<img${beforeSrc}src="${resolved}"`;
    }
  );
  
  return html;
}

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
    ? 'text-black' 
    : 'text-white';
  html = html.replace(/\{\{navColorClass\}\}/g, navColorClass);
  
  // Replace {{mainClass}} with page's mainClass
  const mainClass = page.mainClass || '';
  html = html.replace(/\{\{mainClass\}\}/g, mainClass);
  
  // Replace {{backgroundStyle}} with background style attribute
  const backgroundStyle = page.background 
    ? `style="background-image: url('${page.background}');"` 
    : '';
  html = html.replace(/\{\{backgroundStyle\}\}/g, backgroundStyle);

  html = replaceImageUrls(html);
  
  return html;
}
