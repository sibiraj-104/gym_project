// ============================================================
// GymFuel — File Upload Middleware
// Uses Multer to parse multipart/form-data image uploads in memory.
// Limits file size to 10MB and restricts formats to JPEG, PNG, WEBP.
// ============================================================

import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { Errors } from './errorHandler';

// Use memory storage to avoid VPS disk writes
const storage = multer.memoryStorage();

// Validate file types
const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback,
) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(Errors.badRequest('Only image files (JPEG, PNG, WEBP) are allowed!'));
  }
};

export const uploadSingleImage = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
}).single('image');
