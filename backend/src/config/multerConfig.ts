// backend/src/config/multerConfig.ts
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/aadhaar');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists, or create it
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const randomName = crypto.randomBytes(4).toString('hex');
    cb(null, `${file.fieldname}-${Date.now()}-${randomName}${ext}`);
  }
});

const fileFilter = (req: Express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB size limit
});

export default upload;
