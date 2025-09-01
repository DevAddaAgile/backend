const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// Single image upload
router.post('/', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }
  
  res.json({
    original_url: `http://localhost:${process.env.PORT || 3004}/uploads/${req.file.filename}`,
    filename: req.file.filename
  });
});

// Handle base64 images - store in database instead of file system
function processBase64Image(base64String, filename) {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return null;
  }
  
  const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  
  try {
    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const fileName = `${Date.now()}-${filename}.${extension}`;
    
    return {
      original_url: `http://localhost:${process.env.PORT || 3004}/uploads/${fileName}`,
      filename: fileName,
      base64Data: base64String  // Store the full base64 data
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

router.post('/base64', (req, res) => {
  try {
    const { thumbnail, metaImage } = req.body;
    const result = {};
    
    if (thumbnail && thumbnail.original_url) {
      result.thumbnail = processBase64Image(thumbnail.original_url, 'thumbnail');
    }
    
    if (metaImage && metaImage.original_url) {
      result.metaImage = processBase64Image(metaImage.original_url, 'meta-image');
    }
    
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;