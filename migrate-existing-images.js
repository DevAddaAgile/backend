const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const Blog = require('./models/Blog');
const Category = require('./models/Category');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    migrateImages();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

async function migrateImages() {
  try {
    console.log('Starting image migration...');
    
    // Migrate blog images
    const blogs = await Blog.find({
      $or: [
        { 'thumbnail.original_url': { $exists: true, $ne: null } },
        { 'metaImage.original_url': { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`Found ${blogs.length} blogs with images to migrate`);
    
    for (const blog of blogs) {
      let updated = false;
      
      // Handle thumbnail
      if (blog.thumbnail && blog.thumbnail.original_url && !blog.thumbnail.base64Data) {
        const imagePath = path.join(__dirname, 'uploads', blog.thumbnail.filename);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Data = `data:image/${getImageType(blog.thumbnail.filename)};base64,${imageBuffer.toString('base64')}`;
          blog.thumbnail.base64Data = base64Data;
          updated = true;
          console.log(`Migrated thumbnail for blog: ${blog.title}`);
        }
      }
      
      // Handle meta image
      if (blog.metaImage && blog.metaImage.original_url && !blog.metaImage.base64Data) {
        const imagePath = path.join(__dirname, 'uploads', blog.metaImage.filename);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Data = `data:image/${getImageType(blog.metaImage.filename)};base64,${imageBuffer.toString('base64')}`;
          blog.metaImage.base64Data = base64Data;
          updated = true;
          console.log(`Migrated meta image for blog: ${blog.title}`);
        }
      }
      
      if (updated) {
        await blog.save();
      }
    }
    
    // Migrate category images
    const categories = await Category.find({
      $or: [
        { 'icon.original_url': { $exists: true, $ne: null } },
        { 'image.original_url': { $exists: true, $ne: null } },
        { 'subcategories.icon.original_url': { $exists: true, $ne: null } },
        { 'subcategories.image.original_url': { $exists: true, $ne: null } }
      ]
    });
    
    console.log(`Found ${categories.length} categories with images to migrate`);
    
    for (const category of categories) {
      let updated = false;
      
      // Handle main category icon
      if (category.icon && category.icon.original_url && !category.icon.base64Data) {
        const imagePath = path.join(__dirname, 'uploads', category.icon.filename);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Data = `data:image/${getImageType(category.icon.filename)};base64,${imageBuffer.toString('base64')}`;
          category.icon.base64Data = base64Data;
          updated = true;
          console.log(`Migrated icon for category: ${category.name}`);
        }
      }
      
      // Handle main category image
      if (category.image && category.image.original_url && !category.image.base64Data) {
        const imagePath = path.join(__dirname, 'uploads', category.image.filename);
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Data = `data:image/${getImageType(category.image.filename)};base64,${imageBuffer.toString('base64')}`;
          category.image.base64Data = base64Data;
          updated = true;
          console.log(`Migrated image for category: ${category.name}`);
        }
      }
      
      // Handle subcategory images
      for (let i = 0; i < category.subcategories.length; i++) {
        const subcategory = category.subcategories[i];
        let subcategoryUpdated = false;
        
        // Handle subcategory icon
        if (subcategory.icon && subcategory.icon.original_url && !subcategory.icon.base64Data) {
          const imagePath = path.join(__dirname, 'uploads', subcategory.icon.filename);
          if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Data = `data:image/${getImageType(subcategory.icon.filename)};base64,${imageBuffer.toString('base64')}`;
            category.subcategories[i].icon.base64Data = base64Data;
            subcategoryUpdated = true;
            console.log(`Migrated icon for subcategory: ${subcategory.name}`);
          }
        }
        
        // Handle subcategory image
        if (subcategory.image && subcategory.image.original_url && !subcategory.image.base64Data) {
          const imagePath = path.join(__dirname, 'uploads', subcategory.image.filename);
          if (fs.existsSync(imagePath)) {
            const imageBuffer = fs.readFileSync(imagePath);
            const base64Data = `data:image/${getImageType(subcategory.image.filename)};base64,${imageBuffer.toString('base64')}`;
            category.subcategories[i].image.base64Data = base64Data;
            subcategoryUpdated = true;
            console.log(`Migrated image for subcategory: ${subcategory.name}`);
          }
        }
        
        if (subcategoryUpdated) {
          updated = true;
        }
      }
      
      if (updated) {
        await category.save();
      }
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

function getImageType(filename) {
  const ext = path.extname(filename).toLowerCase();
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'jpeg';
    case '.png':
      return 'png';
    case '.gif':
      return 'gif';
    case '.webp':
      return 'webp';
    default:
      return 'jpeg';
  }
}
