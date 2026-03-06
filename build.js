import path from 'path';
import { fileURLToPath } from 'url';
import buildGeneratedPages from './utils/buildGeneratedPages.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectDir = path.join(__dirname, 'projects/main');
const workspaceRoot = __dirname;
const outputDir = path.join(__dirname, 'public', 'generated');

try {
  const result = buildGeneratedPages({
    projectDir,
    workspaceRoot,
    outputDir,
    cleanOutput: true,
  });

  console.log(`✅ Generated ${result.generatedPages} static page(s)`);
  console.log(`📁 Output: ${result.outputDir}`);
  console.log(`🕒 Generated at: ${result.generatedAt}`);
} catch (error) {
  console.error('❌ Failed to build static pages:', error);
  process.exit(1);
}
