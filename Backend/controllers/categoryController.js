const Category = require('../models/category');
const ErrorResponse = require('../utils/errorResponse');

exports.getCategories = async (req, res, next) => {
  try {
    const categories = await Category.find();
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};


exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};


exports.createCategory = async (req, res, next) => {
  try {
    const { category_name, gender } = req.body;

    // Check if category already exists
    const existingCategory = await Category.findOne({ category_name });
    if (existingCategory) {
      return next(new ErrorResponse(`Category '${category_name}' already exists`, 400));
    }

    const category = await Category.create({
      category_name,
      gender
    });

    res.status(201).json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};


exports.updateCategory = async (req, res, next) => {
  try {
    let category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
    }

    // Checing if new name already exists
    if (req.body.category_name && req.body.category_name !== category.category_name) {
      const existingCategory = await Category.findOne({ category_name: req.body.category_name });
      if (existingCategory) {
        return next(new ErrorResponse(`Category '${req.body.category_name}' already exists`, 400));
      }
    }

    category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: category
    });
  } catch (err) {
    next(err);
  }
};


exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${req.params.id}`, 404));
    }

    // Checking if any products are using this category
    const productsCount = await Product.countDocuments({ category_id: category._id });
    if (productsCount > 0) {
      return next(new ErrorResponse(`Cannot delete category with associated products`, 400));
    }

    await category.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};


exports.getCategoriesByGender = async (req, res, next) => {
  try {
    const { gender } = req.params;
    const validGenders = ['male', 'female', 'unisex'];
    
    if (!validGenders.includes(gender)) {
      return next(new ErrorResponse(`Invalid gender type. Must be one of: ${validGenders.join(', ')}`, 400));
    }

    const categories = await Category.find({ gender });
    
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (err) {
    next(err);
  }
};