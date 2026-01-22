import 'dotenv/config'; 
import { v2 as cloudinary } from 'cloudinary';
import path from 'path';
import fs from 'fs';

// Cloudinary Configuration: Replace with your actual credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

if (!process.env.CLOUDINARY_API_KEY) {
  console.log("Cloudinary API Key is not set");
  // Use process.exit() to stop the entire Node.js program
  process.exit(1);
}

// Define the base folder for local images (must be inside public)
const baseFolderPath = './public/img';
// Choose which subfolder to process
// subfolder: 'analog' or '' for all images in img
//const photoFolderPath = path.join(baseFolderPath, 'analog'); 
const photoFolderPath = path.join(baseFolderPath, ''); 

// The output JSON file for uploaded records
const uploadedFilePath = './uploaded.json';

// Load existing uploaded records if available
let uploadedRecords = {};
if (fs.existsSync(uploadedFilePath)) {
  try {
    uploadedRecords = JSON.parse(fs.readFileSync(uploadedFilePath, 'utf8'));
  } catch (error) {
    console.error("⚠️ Error reading uploaded.json:", error.message);
  }
}

// Counter for new uploads during this run
let newPhotos = 0;

/**
 * Recursively process a folder.
 * @param {string} dir - Absolute path of the folder.
 * @param {string} relPath - Relative path from the baseFolderPath.
 */
async function processFolder(dir, relPath = '') {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    // Build the new relative path from baseFolderPath
    const newRelPath = relPath ? path.join(relPath, entry.name) : entry.name;
    if (entry.isDirectory()) {
      await processFolder(fullPath, newRelPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext)) {
        // folderName should be the full relative path (e.g., "analog/day" or "analog/day/subfolder")
        const folderName = relPath;
        const fileNameWithExtension = entry.name;
        // Use the file name without extension for Cloudinary public_id (Cloudinary adds the extension automatically)
        const publicId = path.parse(entry.name).name;
        // Build record key using the full relative path from baseFolderPath
        const recordKey = folderName ? path.join(folderName, fileNameWithExtension) : fileNameWithExtension;
        if (uploadedRecords[recordKey]) {
          console.log(`⛔ Already uploaded: ${recordKey}`);
          continue;
        }
        await uploadImage(fullPath, publicId, folderName, recordKey);
        // Increase counter for newly uploaded images
        newPhotos++;
      }
    }
  }
}

/**
 * Upload a single image to Cloudinary.
 * @param {string} imagePath - The local image path.
 * @param {string} publicId - The public id to use.
 * @param {string} folder - The folder name for Cloudinary.
 * @param {string} recordKey - The key to store in uploadedRecords.
 */
async function uploadImage(imagePath, publicId, folder, recordKey) {
  try {
    const result = await cloudinary.uploader.upload(imagePath, {
      public_id: publicId,
      folder: folder
    });
    console.log(`✅ Successfully uploaded: ${recordKey}`);
    console.log(`    👉 Access at URL: ${result.secure_url}`);
    // Record the timestamp of upload
    uploadedRecords[recordKey] = new Date().toISOString();
    // Write the updated records to uploaded.json
    fs.writeFileSync(uploadedFilePath, JSON.stringify(uploadedRecords, null, 2));
  } catch (error) {
    console.error(`⚠️ Failed to upload ${imagePath}:`, error.message);
  }
}

// Start processing from the photoFolderPath but compute the relative path from baseFolderPath.
// This way, if photoFolderPath is './public/img/analog/day', then:
const initialRelPath = path.relative(baseFolderPath, photoFolderPath);
(async function bulkUpload() {
  try {
    await processFolder(photoFolderPath, initialRelPath);
    const totalPhotos = Object.keys(uploadedRecords).length;
    console.log('====================================');
    console.log('🚀 Bulk upload complete!');
    console.log('____________________________________');
    console.log('   ☁️  Number of all images in the cloud:', totalPhotos);
    console.log('   👀 New uploaded:', newPhotos);
    console.log('====================================');
  } catch (error) {
    console.log('====================================');
    console.error('⚠️ Error during bulk upload:', error.message);
    console.log('====================================');
  }
})();