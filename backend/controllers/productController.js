const Product = require('../models/Product');
const Order = require('../models/Order');
const Category = require('../models/Category');

// @desc    Get all products
// @route   GET /api/products
// @access  Public
const getProducts = async (req, res) => {
  try {
    // Populate category to get the color along with the product
    const products = await Product.find({}).populate('category', 'name color');
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private/Admin
const createProduct = async (req, res) => {
  const { name, category, price, unit, tax, description, cookingTime, kdsAssigned } = req.body;
  try {
    const product = await Product.create({
      name,
      category,
      price,
      unit,
      tax,
      description,
      cookingTime,
      kdsAssigned
    });
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private/Admin
const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      product.name = req.body.name || product.name;
      product.category = req.body.category || product.category;
      product.price = req.body.price || product.price;
      product.unit = req.body.unit || product.unit;
      product.tax = req.body.tax || product.tax;
      product.description = req.body.description || product.description;
      product.cookingTime = req.body.cookingTime !== undefined ? req.body.cookingTime : product.cookingTime;
      product.kdsAssigned = req.body.kdsAssigned !== undefined ? req.body.kdsAssigned : product.kdsAssigned;
      
      const updatedProduct = await product.save();
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private/Admin
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (product) {
      await product.deleteOne();
      res.json({ message: 'Product removed' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get faster alternatives for a product based on kitchen load
// @route   GET /api/products/alternatives/:productId
// @access  Public
const getProductAlternatives = async (req, res) => {
  try {
    const product = await Product.findById(req.params.productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Calculate current kitchen load
    const activeOrdersCount = await Order.countDocuments({ status: { $in: ['Pending', 'Preparing'] } });
    const estimatedWaitTime = product.cookingTime + (activeOrdersCount * 2);

    // Threshold is 10 minutes
    if (estimatedWaitTime >= 10) {
      // Find faster alternatives in the same category
      const alternatives = await Product.find({
        category: product.category,
        _id: { $ne: product._id },
        cookingTime: { $lt: product.cookingTime }
      }).sort({ cookingTime: 1 }).limit(2);

      if (alternatives.length > 0) {
        // Calculate estimated wait for alternatives and similarity score
        const altsWithWait = alternatives.map(alt => {
          // Calculate similarity score based on price difference
          // Since they are in the same category, base similarity is 95%
          const priceDiffRatio = Math.abs(product.price - alt.price) / (product.price || 1);
          const pricePenalty = Math.min(15, Math.floor(priceDiffRatio * 100));
          const similarityScore = 95 - pricePenalty;

          return {
            ...alt._doc,
            estimatedWaitTime: alt.cookingTime + (activeOrdersCount * 2),
            similarityScore
          };
        });

        return res.json({
          suggest: true,
          estimatedWaitTime,
          alternatives: altsWithWait
        });
      }
    }

    res.json({ suggest: false, estimatedWaitTime });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProducts, createProduct, updateProduct, deleteProduct, getProductAlternatives };
