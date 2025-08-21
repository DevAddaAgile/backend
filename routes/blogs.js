const express = require('express');
const Blog = require('../models/Blog');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const router = express.Router();

// Helper function to save base64 images
function saveBase64Image(base64String, filename) {
  if (!base64String || !base64String.startsWith('data:image/')) {
    return null;
  }
  
  const matches = base64String.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }
  
  try {
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    const imageBuffer = Buffer.from(matches[2], 'base64');
    const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
    const fileName = `${Date.now()}-${filename}.${extension}`;
    const filePath = path.join(uploadsDir, fileName);
    
    fs.writeFileSync(filePath, imageBuffer);
    
    const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3004}`;
    return {
      original_url: `${baseUrl}/uploads/${fileName}`,
      filename: fileName
    };
  } catch (error) {
    console.error('Error saving image:', error);
    return null;
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
    
    // Handle base64 images
    if (blogData.thumbnail && blogData.thumbnail !== null && blogData.thumbnail.original_url && blogData.thumbnail.original_url.startsWith('data:image/')) {
      const savedThumbnail = saveBase64Image(blogData.thumbnail.original_url, 'thumbnail');
      if (savedThumbnail) {
        blogData.thumbnail = savedThumbnail;
      }
    }
    
    if (blogData.metaImage && blogData.metaImage !== null && blogData.metaImage.original_url && blogData.metaImage.original_url.startsWith('data:image/')) {
      const savedMetaImage = saveBase64Image(blogData.metaImage.original_url, 'meta-image');
      if (savedMetaImage) {
        blogData.metaImage = savedMetaImage;
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

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const blogData = { ...req.body };
    
    // Handle base64 images
    if (blogData.thumbnail && blogData.thumbnail.original_url && blogData.thumbnail.original_url.startsWith('data:image/')) {
      blogData.thumbnail = saveBase64Image(blogData.thumbnail.original_url, 'thumbnail');
    }
    
    if (blogData.metaImage && blogData.metaImage.original_url && blogData.metaImage.original_url.startsWith('data:image/')) {
      blogData.metaImage = saveBase64Image(blogData.metaImage.original_url, 'meta-image');
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

module.exports = router;