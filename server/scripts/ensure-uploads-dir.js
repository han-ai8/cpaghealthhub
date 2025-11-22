// server/scripts/ensure-uploads-dir.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');

console.log('🔍 Checking uploads directory...');
console.log('📁 Path:', uploadsDir);

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory');
  } else {
    console.log('✅ Uploads directory already exists');
  }
  
  // Create a .gitkeep file to preserve the directory in git
  const gitkeepPath = path.join(uploadsDir, '.gitkeep');
  if (!fs.existsSync(gitkeepPath)) {
    fs.writeFileSync(gitkeepPath, '# This file ensures the uploads directory is tracked by git\n');
    console.log('✅ Created .gitkeep file');
  } else {
    console.log('✅ .gitkeep file already exists');
  }
  
  // Check directory permissions
  try {
    fs.accessSync(uploadsDir, fs.constants.W_OK);
    console.log('✅ Directory is writable');
  } catch (err) {
    console.error('❌ Directory is not writable!');
    console.error('   Please check permissions');
  }
  
  console.log('\n🎉 Setup complete!');
  console.log('📦 Uploads directory is ready at:', uploadsDir);
  
} catch (error) {
  console.error('❌ Error setting up uploads directory:', error);
  process.exit(1);
}