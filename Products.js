const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    _id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true
    },
    Name: {
      type: String,
      required: true
    },
    Price: {
      type: String,
      required: true
    },
    Description: {
      type: String,
      required: true
    },
    Quantity: {
      type: String,
      required: true
    },
    Category: {
      type: String,
      required: true
    },
    Stock: {
      type: Number,
      required: true
    },
    ProductImage1: {
      type: String,
      required: true
    },
    ProductImage2: {
      type: String
    },
    ProductImage3: {
      type: String
    },
    Brand: {
      type: String,
      required: true
    }
  });
const ProductModel = mongoose.model("supermarket_products",productSchema)
module.exports = ProductModel