const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: String,
  description: String,
  status: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model('Category', categorySchema);