// backend/routes/upload.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Check and create uploads directory
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function(req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC and DOCX files are accepted.'));
    }
  }
});

// CORS middleware specifically for upload route
const corsMiddleware = (req, res, next) => {
  // Allow requests from any origin
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-auth-token');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};

router.post('/', corsMiddleware, upload.single('resume'), async (req, res) => {
  try {
    // Set CORS headers again just to be sure
    res.header('Access-Control-Allow-Origin', '*');
    
    if (!req.file) {
      return res.status(400).json({ error: 'File could not be uploaded' });
    }
    
    // Log file information for debugging
    console.log('Uploaded file:', {
      originalname: req.file.originalname,
      filename: req.file.filename,
      path: req.file.path,
      size: req.file.size
    });
    
    // Verify file exists after upload
    if (!fs.existsSync(req.file.path)) {
      console.error('File not found after upload:', req.file.path);
      return res.status(500).json({ error: 'File was uploaded but could not be saved' });
    }
    
    // Log request headers for debugging
    console.log('Upload request headers:', req.headers);
    
    // Return just the filename instead of the full path
    res.json({
      success: true,
      filePath: req.file.filename, // Just return the filename
      message: 'File uploaded successfully'
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
