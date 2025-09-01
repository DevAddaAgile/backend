const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const User = require('./models/User');





// Dynamic image serving - create images from database if they don't exist
app.get('/uploads/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (require('fs').existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    
    // If file doesn't exist, try to find it in database and recreate
    const Blog = require('./models/Blog');
    const Category = require('./models/Category');
    
    // Check blogs
    const blogs = await Blog.find({
      $or: [
        { 'thumbnail.filename': filename },
        { 'metaImage.filename': filename }
      ]
    });
    
    for (const blog of blogs) {
      if (blog.thumbnail && blog.thumbnail.filename === filename && blog.thumbnail.base64Data) {
        const fs = require('fs');
        const matches = blog.thumbnail.base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const imageBuffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, imageBuffer);
          return res.sendFile(filePath);
        }
      }
      if (blog.metaImage && blog.metaImage.filename === filename && blog.metaImage.base64Data) {
        const fs = require('fs');
        const matches = blog.metaImage.base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const imageBuffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, imageBuffer);
          return res.sendFile(filePath);
        }
      }
    }
    
    // Check categories
    const categories = await Category.find({
      $or: [
        { 'icon.filename': filename },
        { 'image.filename': filename },
        { 'subcategories.icon.filename': filename },
        { 'subcategories.image.filename': filename }
      ]
    });
    
    for (const category of categories) {
      // Check main category icon
      if (category.icon && category.icon.filename === filename && category.icon.base64Data) {
        const fs = require('fs');
        const matches = category.icon.base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const imageBuffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, imageBuffer);
          return res.sendFile(filePath);
        }
      }
      // Check main category image
      if (category.image && category.image.filename === filename && category.image.base64Data) {
        const fs = require('fs');
        const matches = category.image.base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }
          const imageBuffer = Buffer.from(matches[2], 'base64');
          fs.writeFileSync(filePath, imageBuffer);
          return res.sendFile(filePath);
        }
      }
      // Check subcategory icons and images
      for (const subcategory of category.subcategories) {
        if (subcategory.icon && subcategory.icon.filename === filename && subcategory.icon.base64Data) {
          const fs = require('fs');
          const matches = subcategory.icon.base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const imageBuffer = Buffer.from(matches[2], 'base64');
            fs.writeFileSync(filePath, imageBuffer);
            return res.sendFile(filePath);
          }
        }
        if (subcategory.image && subcategory.image.filename === filename && subcategory.image.base64Data) {
          const fs = require('fs');
          const matches = subcategory.image.base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            if (!fs.existsSync(uploadsDir)) {
              fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const imageBuffer = Buffer.from(matches[2], 'base64');
            fs.writeFileSync(filePath, imageBuffer);
            return res.sendFile(filePath);
          }
        }
      }
    }
    
    res.status(404).json({ message: 'Image not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Static files (fallback for existing files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!', timestamp: new Date() });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/blogs', require('./routes/blogs'));
app.use('/api/tags', require('./routes/tags'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/upload', require('./routes/upload'));



// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
  .then(async () => {
    console.log('MongoDB connected');
    
    // Create default admin user if not exists
    const adminExists = await User.findOne({ email: 'admin@example.com' });
    if (!adminExists) {
      const admin = new User({
        name: 'Admin',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin'
      });
      await admin.save();
      console.log('Default admin created: admin@example.com / admin123');
    }
  })
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;