/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Scan server-side rendering files for Tailwind classes
    "./server.js",
    "./utils/**/*.js",
    "./templates/**/*.js",           // Template files
    "./projects/**/pages/**/*.md",  // Project markdown pages
    
    // Keep HTML scanning in case you add any HTML files later
    "./*.html",
    "./**/*.html",
    "!./node_modules", // Explicitly exclude node_modules
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

