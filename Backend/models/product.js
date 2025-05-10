//product model
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  product_name: {
    type: String,
    required: true,
    trim: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },
  images: {
    type: [String],
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  stock_quantity: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  created_by: {
    type: String,
    required: true
  },
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});
// saving according to the date
productSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);