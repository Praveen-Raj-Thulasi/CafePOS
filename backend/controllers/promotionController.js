const Promotion = require('../models/Promotion');

const getAllPromotions = async (req, res) => {
  try {
    const promotions = await Promotion.find().populate('targetProduct', 'name').sort({ createdAt: -1 });
    res.json(promotions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createPromotion = async (req, res) => {
  try {
    const { name, type, targetProduct, minQuantity, minOrderAmount, discountType, discountValue } = req.body;
    
    const promotion = new Promotion({
      name,
      type,
      targetProduct: type === 'Product' ? targetProduct : undefined,
      minQuantity: type === 'Product' ? minQuantity : 0,
      minOrderAmount: type === 'Order' ? minOrderAmount : 0,
      discountType,
      discountValue
    });
    
    await promotion.save();
    
    const populated = await Promotion.findById(promotion._id).populate('targetProduct', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const togglePromotionStatus = async (req, res) => {
  try {
    const promotion = await Promotion.findById(req.params.id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    
    promotion.isActive = !promotion.isActive;
    await promotion.save();
    
    const populated = await Promotion.findById(promotion._id).populate('targetProduct', 'name');
    res.json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deletePromotion = async (req, res) => {
  try {
    const promotion = await Promotion.findByIdAndDelete(req.params.id);
    if (!promotion) return res.status(404).json({ message: 'Promotion not found' });
    res.json({ message: 'Promotion deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllPromotions,
  createPromotion,
  togglePromotionStatus,
  deletePromotion
};
