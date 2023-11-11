const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the user model
    required:true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'supermarket_products', // Reference to the product model
    require:true
  },
  quantity: {
    type: Number,
    required: true
  },
  totalAmount: {
    type: Number, // This field stores the total amount for the cart item.
    required: false,
  },
});

module.exports = mongoose.model('Cart', cartSchema);
