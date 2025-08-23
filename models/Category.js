const mongoose = require('mongoose');

const subcategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  slug: String,
  icon: {
    original_url: String,
    filename: String
  },
  image: {
    original_url: String,
    filename: String
  },
  status: { type: Number, default: 1 }
}, { timestamps: true });

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: String,
  description: String,
  icon: {
    original_url: String,
    filename: String
  },
  image: {
    original_url: String,
    filename: String
  },
  status: { type: Number, default: 1 },
  parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', default: null },
  subcategories: [subcategorySchema]
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);