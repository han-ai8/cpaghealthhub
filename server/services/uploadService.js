// server/services/uploadService.js
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// CLOUDINARY CONFIGURATION
// ============================================
const useCloudinary = process.env.FILE_STORAGE === 'cloudinary' && 
                      process.env.CLOUDINARY_CLOUD_NAME &&
                      process.env.CLOUDINARY_API_KEY &&
                      process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️ Cloudinary configured for file uploads');
}

// ============================================
// STORAGE CONFIGURATION
// ============================================
let storage;

if (useCloudinary) {
  // CLOUDINARY STORAGE (Production)
  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'healthhub',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [{ width: 1200, height: 1200, crop: 'limit' }]
    }
  });
} else {
  // LOCAL STORAGE (Development)
  const uploadsDir = path.join(__dirname, '..', 'uploads');
  
  // Create uploads directory if it doesn't exist
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('✅ Created uploads directory:', uploadsDir);
  }
  
  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const ext = path.extname(file.originalname);
      const nameWithoutExt = path.basename(file.originalname, ext);
      cb(null, `${nameWithoutExt}-${uniqueSuffix}${ext}`);
    }
  });
}

// ============================================
// MULTER UPLOAD MIDDLEWARE
// ============================================
export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, GIF, WEBP) are allowed'), false);
    }
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get the image path/URL from uploaded file
 */
export const getImagePath = (file) => {
  if (!file) return null;
  
  if (useCloudinary) {
    // Cloudinary returns secure_url
    return file.path;
  } else {
    // Local storage returns relative path
    return `/uploads/${file.filename}`;
  }
};

/**
 * Delete an image file
 */
export const deleteImage = async (imagePath) => {
  if (!imagePath) return;
  
  try {
    if (useCloudinary) {
      // Extract public_id from Cloudinary URL
      // URL format: https://res.cloudinary.com/cloud/image/upload/v123/healthhub/filename.jpg
      const matches = imagePath.match(/\/healthhub\/([^/.]+)/);
      if (matches && matches[1]) {
        const publicId = `healthhub/${matches[1]}`;
        await cloudinary.uploader.destroy(publicId);
        console.log('🗑️ Deleted from Cloudinary:', publicId);
      }
    } else {
      // Delete local file
      const fullPath = path.join(__dirname, '..', imagePath);
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
        console.log('🗑️ Deleted local file:', fullPath);
      }
    }
  } catch (error) {
    console.error('❌ Error deleting image:', error);
  }
};

/**
 * Check if using cloud storage
 */
export const isCloudStorage = () => useCloudinary;

export default {
  upload,
  getImagePath,
  deleteImage,
  isCloudStorage
};