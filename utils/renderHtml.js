/**
 * Render HTML from a template function with variables
 * @param {Object} props - Object containing all template variables
 * @param {Function} templateFn - Function that returns a template string literal
 * @returns {String} Rendered HTML
 * 
 * @example
 * const html = renderHtml(
 *   { name: 'John', age: 30 },
 *   (props) => `<h1>Hello ${props.name}, you are ${props.age} years old</h1>`
 * );
 */
export default function renderHtml(props, templateFn) {
  try {
    return templateFn(props);
  } catch (error) {
    // Log the error for debugging
    console.error('❌ Template rendering error:', error.message);
    console.error('Template function:', templateFn.name || 'anonymous');
    console.error('Props received:', Object.keys(props || {}));
    console.error('Full error:', error);
    
    const errorHtml = "";
    
    return errorHtml;
  }
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {String} str - String to escape
 * @returns {String} Escaped string
 */
export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
