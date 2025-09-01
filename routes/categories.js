const express = require('express');
const Category = require('../models/Category');
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
    const categories = await Category.find({ parent: null })
      .populate('subcategories')
      .sort({ name: 1 });
    
    // Ensure images exist for all categories and subcategories
    for (const category of categories) {
      if (category.icon) {
        ensureImageExists(category.icon);
      }
      if (category.image) {
        ensureImageExists(category.image);
      }
      
      // Handle subcategories
      for (const subcategory of category.subcategories) {
        if (subcategory.icon) {
          ensureImageExists(subcategory.icon);
        }
        if (subcategory.image) {
          ensureImageExists(subcategory.image);
        }
      }
    }
    
    res.json({ data: categories, total: categories.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
      .populate('subcategories');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Ensure images exist for this category and its subcategories
    if (category.icon) {
      ensureImageExists(category.icon);
    }
    if (category.image) {
      ensureImageExists(category.image);
    }
    
    // Handle subcategories
    for (const subcategory of category.subcategories) {
      if (subcategory.icon) {
        ensureImageExists(subcategory.icon);
      }
      if (subcategory.image) {
        ensureImageExists(subcategory.image);
      }
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const categoryData = { ...req.body };
    
    // Handle base64 images for icon - store in database instead of file system
    if (categoryData.icon && categoryData.icon.original_url && categoryData.icon.original_url.startsWith('data:image/')) {
      const processedIcon = processBase64Image(categoryData.icon.original_url, 'icon');
      if (processedIcon) {
        categoryData.icon = processedIcon;
      }
    }
    
    // Handle base64 images for image - store in database instead of file system
    if (categoryData.image && categoryData.image.original_url && categoryData.image.original_url.startsWith('data:image/')) {
      const processedImage = processBase64Image(categoryData.image.original_url, 'image');
      if (processedImage) {
        categoryData.image = processedImage;
      }
    }
    
    // Handle subcategory creation
    if (categoryData.parent && mongoose.Types.ObjectId.isValid(categoryData.parent)) {
      // This is a subcategory - add it to the parent category
      const parentCategory = await Category.findById(categoryData.parent);
      if (!parentCategory) {
        return res.status(404).json({ message: 'Parent category not found' });
      }
      
      // Create subcategory object
      const subcategory = {
        name: categoryData.name,
        description: categoryData.description,
        slug: categoryData.slug,
        icon: categoryData.icon,
        image: categoryData.image,
        status: categoryData.status || 1
      };
      
      // Add subcategory to parent
      parentCategory.subcategories.push(subcategory);
      await parentCategory.save();
      
      res.status(201).json(parentCategory);
    } else {
      // This is a main category
      categoryData.parent = null; // Ensure parent is null for main categories
      const category = new Category(categoryData);
      await category.save();
      res.status(201).json(category);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const categoryData = { ...req.body };
    
    // Handle base64 images for icon - store in database instead of file system
    if (categoryData.icon && categoryData.icon.original_url && categoryData.icon.original_url.startsWith('data:image/')) {
      const processedIcon = processBase64Image(categoryData.icon.original_url, 'icon');
      if (processedIcon) {
        categoryData.icon = processedIcon;
      }
    }
    
    // Handle base64 images for image - store in database instead of file system
    if (categoryData.image && categoryData.image.original_url && categoryData.image.original_url.startsWith('data:image/')) {
      const processedImage = processBase64Image(categoryData.image.original_url, 'image');
      if (processedImage) {
        categoryData.image = processedImage;
      }
    }
    
    // Check if this is a subcategory update (has parent in body)
    if (categoryData.parent && mongoose.Types.ObjectId.isValid(categoryData.parent)) {
      // This is a subcategory update - find parent category first
      const parentCategory = await Category.findById(categoryData.parent);
      if (!parentCategory) {
        return res.status(404).json({ message: 'Parent category not found' });
      }
      
      // Find the subcategory within the parent category
      const subcategoryIndex = parentCategory.subcategories.findIndex(
        sub => sub._id.toString() === req.params.id
      );
      
      if (subcategoryIndex === -1) {
        return res.status(404).json({ message: 'Subcategory not found in parent category' });
      }
      
      // Update subcategory fields
      Object.keys(categoryData).forEach(key => {
        if (categoryData[key] !== undefined && key !== 'parent') {
          parentCategory.subcategories[subcategoryIndex][key] = categoryData[key];
        }
      });
      
      await parentCategory.save();
      res.json(parentCategory);
    } else {
      // This is a main category update
      const category = await Category.findByIdAndUpdate(req.params.id, categoryData, { new: true })
        .populate('subcategories');
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      res.json(category);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update subcategory
router.put('/:categoryId/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const updateData = { ...req.body };
    
    // Handle base64 images for subcategory icon - store in database instead of file system
    if (updateData.icon && updateData.icon.original_url && updateData.icon.original_url.startsWith('data:image/')) {
      const processedIcon = processBase64Image(updateData.icon.original_url, 'subcategory-icon');
      if (processedIcon) {
        updateData.icon = processedIcon;
      }
    }
    
    // Handle base64 images for subcategory image - store in database instead of file system
    if (updateData.image && updateData.image.original_url && updateData.image.original_url.startsWith('data:image/')) {
      const processedImage = processBase64Image(updateData.image.original_url, 'subcategory-image');
      if (processedImage) {
        updateData.image = processedImage;
      }
    }
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const subcategoryIndex = category.subcategories.findIndex(
      sub => sub._id.toString() === subcategoryId
    );
    
    if (subcategoryIndex === -1) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    // Update subcategory fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        category.subcategories[subcategoryIndex][key] = updateData[key];
      }
    });
    
    await category.save();
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get subcategories for a specific category
router.get('/:categoryId/subcategories', async (req, res) => {
  try {
    const { categoryId } = req.params;
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    // Ensure images exist for subcategories
    for (const subcategory of category.subcategories) {
      if (subcategory.icon) {
        ensureImageExists(subcategory.icon);
      }
      if (subcategory.image) {
        ensureImageExists(subcategory.image);
      }
    }
    
    res.json({ data: category.subcategories, total: category.subcategories.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete subcategory
router.delete('/:categoryId/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    
    const subcategoryIndex = category.subcategories.findIndex(
      sub => sub._id.toString() === subcategoryId
    );
    
    if (subcategoryIndex === -1) {
      return res.status(404).json({ message: 'Subcategory not found' });
    }
    
    // Remove subcategory
    category.subcategories.splice(subcategoryIndex, 1);
    await category.save();
    
    res.json({ message: 'Subcategory deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully' });
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
      if (category.icon && category.icon.filename === filename) {
        if (ensureImageExists(category.icon)) {
          return res.sendFile(filePath);
        }
      }
      // Check main category image
      if (category.image && category.image.filename === filename) {
        if (ensureImageExists(category.image)) {
          return res.sendFile(filePath);
        }
      }
      // Check subcategory icons and images
      for (const subcategory of category.subcategories) {
        if (subcategory.icon && subcategory.icon.filename === filename) {
          if (ensureImageExists(subcategory.icon)) {
            return res.sendFile(filePath);
          }
        }
        if (subcategory.image && subcategory.image.filename === filename) {
          if (ensureImageExists(subcategory.image)) {
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

module.exports = router;