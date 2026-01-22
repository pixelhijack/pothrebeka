import path from 'path';
import fs from 'fs';

const rootDir = './public/img'; // The root folder for your images
const outputFilePath = './public/folder.json'; // The output JSON file

/**
 * Recursively reads a directory and builds the file structure, excluding .DS_Store.
 * @param {string} dir The directory to read.
 * @returns {object} The tree structure.
 */
function readDirRecursive(dir) {
  const node = {
    name: path.basename(dir),
    type: 'folder',
    children: []
  };

  const items = fs.readdirSync(dir, { withFileTypes: true });

  for (const item of items) {
    if (item.name === '.DS_Store') {
      continue; // Skip .DS_Store files
    }

    const itemPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      node.children.push(readDirRecursive(itemPath));
    } else if (item.isFile()) {
      node.children.push({
        name: item.name,
        type: 'file',
      });
    }
  }
  return node;
}

// ------------------------------------------------------------------------------------------------------------------

/**
 * Builds the flat and path structures, excluding standalone images from the root img folder.
 * @param {string} dir The directory to read.
 * @param {string} currentPath The relative path from the root.
 * @param {object} flat The flat object to populate.
 * @param {object} pathMap The path object to populate.
 * @param {object} dupeTracker A tracker for duplicate filenames.
 */
function buildStructures(dir, currentPath, flat, pathMap, dupeTracker) {
  const items = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  for (const item of items) {
    if (item.name === '.DS_Store') {
      continue; // Skip .DS_Store files
    }

    const itemPath = path.join(dir, item.name);
    const relativePath = path.join(currentPath, item.name);

    if (item.isDirectory()) {
      // Recursively process subdirectories
      buildStructures(itemPath, relativePath, flat, pathMap, dupeTracker);
    } else if (item.isFile() && currentPath !== '') {
      // Only process files if they are in a subfolder (i.e., not the root)
      const fileName = item.name;
      const fileDir = path.dirname(relativePath);
      files.push(fileName);
      
      // Check for duplicates and log them
      if (dupeTracker[fileName]) {
        console.warn(`⚠️ Warning: Duplicate filename found! The path for "${fileName}" will be stored as an array.`);
        console.warn(`  - Existing path: ${path.join(rootDir, pathMap[fileName])}`);
        console.warn(`  - New path:      ${path.join(rootDir, fileDir)}`);

        // Convert the value to an array if it's not already
        if (!Array.isArray(pathMap[fileName])) {
          pathMap[fileName] = [pathMap[fileName]];
        }
        pathMap[fileName].push(fileDir);
      } else {
        pathMap[fileName] = fileDir;
        dupeTracker[fileName] = true;
      }
    }
  }

  // Populate the flat structure only for subdirectories
  if (currentPath !== '' && files.length > 0) {
    flat[currentPath.replace(/\\/g, '/')] = files;
  }
}

// ------------------------------------------------------------------------------------------------------------------

// Main execution
function main() {
  const treeRoot = {
    name: path.basename(rootDir),
    type: 'folder',
    children: []
  };
  const items = fs.readdirSync(rootDir, { withFileTypes: true });

  for (const item of items) {
    if (item.name === '.DS_Store') {
      continue;
    }
    const itemPath = path.join(rootDir, item.name);
    if (item.isDirectory()) {
      treeRoot.children.push(readDirRecursive(itemPath));
    } else if (item.isFile()) {
      treeRoot.children.push({
        name: item.name,
        type: 'file',
      });
    }
  }

  const flatStructure = {};
  const pathStructure = {};
  const dupeTracker = {};

  const subfolders = fs.readdirSync(rootDir, { withFileTypes: true }).filter(item => item.isDirectory());
  for (const folder of subfolders) {
      buildStructures(path.join(rootDir, folder.name), folder.name, flatStructure, pathStructure, dupeTracker);
  }

  const finalJson = {
    tree: treeRoot,
    flat: flatStructure,
    path: pathStructure
  };

  fs.writeFileSync(outputFilePath, JSON.stringify(finalJson, null, 2), 'utf-8');
  console.log('\n✅ JSON file created successfully!');
}

main();