const express = require('express');
const Category = require('../models/Category');
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
    const categories = await Category.find({ parent: null })
      .populate('subcategories')
      .sort({ name: 1 });
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
    res.json(category);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const categoryData = { ...req.body };
    
    // Handle base64 images for icon
    if (categoryData.icon && categoryData.icon.original_url && categoryData.icon.original_url.startsWith('data:image/')) {
      const savedIcon = saveBase64Image(categoryData.icon.original_url, 'icon');
      if (savedIcon) {
        categoryData.icon = savedIcon;
      }
    }
    
    // Handle base64 images for image
    if (categoryData.image && categoryData.image.original_url && categoryData.image.original_url.startsWith('data:image/')) {
      const savedImage = saveBase64Image(categoryData.image.original_url, 'image');
      if (savedImage) {
        categoryData.image = savedImage;
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
    
    // Handle base64 images for icon
    if (categoryData.icon && categoryData.icon.original_url && categoryData.icon.original_url.startsWith('data:image/')) {
      const savedIcon = saveBase64Image(categoryData.icon.original_url, 'icon');
      if (savedIcon) {
        categoryData.icon = savedIcon;
      }
    }
    
    // Handle base64 images for image
    if (categoryData.image && categoryData.image.original_url && categoryData.image.original_url.startsWith('data:image/')) {
      const savedImage = saveBase64Image(categoryData.image.original_url, 'image');
      if (savedImage) {
        categoryData.image = savedImage;
      }
    }
    
    const category = await Category.findByIdAndUpdate(req.params.id, categoryData, { new: true })
      .populate('subcategories');
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
    res.json(category);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update subcategory
router.put('/:categoryId/subcategory/:subcategoryId', async (req, res) => {
  try {
    const { categoryId, subcategoryId } = req.params;
    const updateData = { ...req.body };
    
    // Handle base64 images for subcategory icon
    if (updateData.icon && updateData.icon.original_url && updateData.icon.original_url.startsWith('data:image/')) {
      const savedIcon = saveBase64Image(updateData.icon.original_url, 'subcategory-icon');
      if (savedIcon) {
        updateData.icon = savedIcon;
      }
    }
    
    // Handle base64 images for subcategory image
    if (updateData.image && updateData.image.original_url && updateData.image.original_url.startsWith('data:image/')) {
      const savedImage = saveBase64Image(updateData.image.original_url, 'subcategory-image');
      if (savedImage) {
        updateData.image = savedImage;
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

module.exports = router;