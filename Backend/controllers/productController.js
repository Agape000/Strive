const Product = require('../models/product');
const Category = require('../models/category');
const ErrorResponse = require('../utils/errorResponse');

exports.getProducts = async (req, res, next) => {
  try {
    let query;
    const queryObj = { ...req.query };
    
    // Handle gende filtering using the category
    if (req.query.gender) {
      const genderCategories = await Category.find({ gender: req.query.gender });
      queryObj.category_id = { $in: genderCategories.map(c => c._id) };
      delete queryObj.gender; // Removes gende conflicts
    }

    // filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte)\b/g, match => `$${match}`);
    
    query = Product.find(JSON.parse(queryStr)).populate({
      path: 'category_id',
      select: 'category_name gender'
    });

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-created_at');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Product.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Executing query
    const products = await query;

    // Pagination result
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: products.length,
      pagination,
      data: products
    });
  } catch (err) {
    next(err);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).populate({
      path: 'category_id',
      select: 'category_name gender'
    });
    
    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    // Verifyin if  category exists
    const category = await Category.findById(req.body.category_id);
    if (!category) {
      return next(new ErrorResponse(`Category not found with id of ${req.body.category_id}`, 404));
    }

    req.body.created_by = req.user.id;

    const product = await Product.create(req.body);

    // Populate category info's in response
    const populatedProduct = await Product.findById(product._id).populate({
      path: 'category_id',
      select: 'category_name gender'
    });

    res.status(201).json({
      success: true,
      data: populatedProduct
    });
  } catch (err) {
    next(err);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    // verifying if teh new category exists
    if (req.body.category_id) {
      const category = await Category.findById(req.body.category_id);
      if (!category) {
        return next(new ErrorResponse(`Category not found with id of ${req.body.category_id}`, 404));
      }
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate({
      path: 'category_id',
      select: 'category_name gender'
    });

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return next(new ErrorResponse(`Product not found with id of ${req.params.id}`, 404));
    }

    await product.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};