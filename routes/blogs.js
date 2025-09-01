const express = require('express');
const Blog = require('../models/Blog');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Helper function to process base64 images and store in database
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
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3004}`;
    return {
      original_url: `${baseUrl}/uploads/${fileName}`,
      filename: fileName,
      base64Data: base64String  // Store the full base64 data
    };
  } catch (error) {
    console.error('Error processing image:', error);
    return null;
  }
}

// Helper function to dynamically create image file from base64 data
function ensureImageExists(imageData) {
  if (!imageData || !imageData.base64Data || !imageData.filename) {
    return false;
  }
  
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, imageData.filename);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return true;
    }
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Extract base64 data and create file
    const matches = imageData.base64Data.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return false;
    }
    
    const imageBuffer = Buffer.from(matches[2], 'base64');
    fs.writeFileSync(filePath, imageBuffer);
    
    return true;
  } catch (error) {
    console.error('Error creating image file:', error);
    return false;
  }
}

router.get('/', async (req, res) => {
  try {
    const blogs = await Blog.find()
      .populate('created_by', 'name email')
      .populate('categories')
      .populate('tags')
      .sort({ createdAt: -1 })
      .maxTimeMS(5000);
    
    // Ensure images exist for all blogs
    for (const blog of blogs) {
      if (blog.thumbnail) {
        ensureImageExists(blog.thumbnail);
      }
      if (blog.metaImage) {
        ensureImageExists(blog.metaImage);
      }
    }
    
    res.json({ data: blogs, total: blogs.length });
  } catch (error) {
    // Return mock data if MongoDB fails
    if (error.message.includes('buffering timed out') || error.message.includes('timeout')) {
      res.json({ 
        data: [{
          _id: '1',
          title: 'Sample Blog Post',
          slug: 'sample-blog-post',
          content: 'This is a sample blog post content.',
          status: 1,
          createdAt: new Date()
        }], 
        total: 1,
        message: 'Using mock data - MongoDB connection timeout'
      });
    } else {
      res.status(500).json({ message: error.message });
    }
  }
});

router.get('/published', async (req, res) => {
  try {
    const blogs = await Blog.find({ published: true })
      .populate('created_by', 'name email')
      .populate('categories')
      .populate('tags')
      .sort({ createdAt: -1 });
    
    // Ensure images exist for all blogs
    for (const blog of blogs) {
      if (blog.thumbnail) {
        ensureImageExists(blog.thumbnail);
      }
      if (blog.metaImage) {
        ensureImageExists(blog.metaImage);
      }
    }
    
    res.json({ data: blogs, total: blogs.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const blogData = { ...req.body };
    
    // Convert string IDs to ObjectIds
    if (blogData.categories) {
      blogData.categories = blogData.categories.filter(id => id && mongoose.Types.ObjectId.isValid(id));
    }
    
    if (blogData.tags) {
      blogData.tags = blogData.tags.filter(id => id && mongoose.Types.ObjectId.isValid(id));
    }
    
    // Handle base64 images - store in database instead of file system
    if (blogData.thumbnail && blogData.thumbnail !== null && blogData.thumbnail.original_url && blogData.thumbnail.original_url.startsWith('data:image/')) {
      const processedThumbnail = processBase64Image(blogData.thumbnail.original_url, 'thumbnail');
      if (processedThumbnail) {
        blogData.thumbnail = processedThumbnail;
      }
    }
    
    if (blogData.metaImage && blogData.metaImage !== null && blogData.metaImage.original_url && blogData.metaImage.original_url.startsWith('data:image/')) {
      const processedMetaImage = processBase64Image(blogData.metaImage.original_url, 'meta-image');
      if (processedMetaImage) {
        blogData.metaImage = processedMetaImage;
      }
    }
    
    const blog = new Blog(blogData);
    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    let blog;
    // Check if it's an ObjectId or slug
    if (req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      blog = await Blog.findById(req.params.id)
        .populate('created_by', 'name email')
        .populate('categories')
        .populate('tags');
    } else {
      blog = await Blog.findOne({ slug: req.params.id })
        .populate('created_by', 'name email')
        .populate('categories')
        .populate('tags');
    }
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Ensure images exist for this blog
    if (blog.thumbnail) {
      ensureImageExists(blog.thumbnail);
    }
    if (blog.metaImage) {
      ensureImageExists(blog.metaImage);
    }

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const blogData = { ...req.body };
    
    // Handle base64 images - store in database instead of file system
    if (blogData.thumbnail && blogData.thumbnail.original_url && blogData.thumbnail.original_url.startsWith('data:image/')) {
      blogData.thumbnail = processBase64Image(blogData.thumbnail.original_url, 'thumbnail');
    }
    
    if (blogData.metaImage && blogData.metaImage.original_url && blogData.metaImage.original_url.startsWith('data:image/')) {
      blogData.metaImage = processBase64Image(blogData.metaImage.original_url, 'meta-image');
    }
    
    const blog = await Blog.findByIdAndUpdate(req.params.id, blogData, { new: true });
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json(blog);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route to handle image requests and dynamically create images if needed
router.get('/image/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    const filePath = path.join(uploadsDir, filename);
    
    // Check if file exists
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    
    // If file doesn't exist, try to find it in database and recreate
    const blogs = await Blog.find({
      $or: [
        { 'thumbnail.filename': filename },
        { 'metaImage.filename': filename }
      ]
    });
    
    for (const blog of blogs) {
      if (blog.thumbnail && blog.thumbnail.filename === filename) {
        if (ensureImageExists(blog.thumbnail)) {
          return res.sendFile(filePath);
        }
      }
      if (blog.metaImage && blog.metaImage.filename === filename) {
        if (ensureImageExists(blog.metaImage)) {
          return res.sendFile(filePath);
        }
      }
    }
    
    res.status(404).json({ message: 'Image not found' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;