const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    
    Name: {
      type: String,
      required: true,
      unique: true,
    },
    Price: {
      type: String,
      required: true
    },
    DiscountedPrice:{
      type: String,
      required: false
    },
    Taxable:{
      type:Boolean,
      required: true
    },
    Description: {
      type: String,
      required: false
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
      type: String,
      required: false
    },
    ProductImage3: {
      type: String,
      required: false
    },
    Brand: {
      type: String,
      required: true
    },
    Tags: {
      type: [String], // Array of strings to store multiple tags
      default: [],
    },
    offer:{
      percentageOffer:{
        type:Boolean,
        default:false,
      },
      isActive:{
        type:Boolean,
        default:false,
      },
      discountPercentage:{
        type:Number,
        default:0,
      },
      startDate:{
        type: Date,
        required:false,
      },
      endDate:{
        type: Date,
        required:false,
      }
    }
  });
  const ProductModel = mongoose.model("supermarket_products", productSchema);

module.exports = ProductModel