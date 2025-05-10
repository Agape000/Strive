//the category model
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unisex'],
    required: true
  }
});

module.exports = mongoose.model('Category', categorySchema);