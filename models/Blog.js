const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: String,
  description: { type: String, required: true },
  content: { type: String, required: true },
  metaTitle: String,
  metaDescription: String,
  metaImage: {
    original_url: String,
    filename: String,
    base64Data: String  // Store base64 data for dynamic image recreation
  },
  thumbnail: {
    original_url: String,
    filename: String,
    base64Data: String  // Store base64 data for dynamic image recreation
  },
  featured: { type: Boolean, default: false },
  sticky: { type: Boolean, default: false },
  published: { type: Boolean, default: true },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }]
}, { timestamps: true });

module.exports = mongoose.model('Blog', blogSchema);