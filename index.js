const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose  = require ('mongoose')
const { v4: uuidv4 } = require('uuid');
const cors = require ('cors')
const ProductModel = require('./Products')
const Usermodel = require('./User');
const app = express();
 const stripe = require("./PaymentRoutes/Stripe")
const router = express.Router();
const crypto = require('crypto');
const Cart = require('./Cart');
const path = require('path');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  },
}); // You can adjust this storage method based on your requirements
app.use(express.static(path.join(__dirname+"/public")))
app.use(cors())
app.use(express.json())
app.use('/cart', router); 
app.use("/api/stripe",stripe)
// mongoose.connect("mongodb+srv://Namaste:ram123@clusternamaste.iplr4cq.mongodb.net/")
const url = "mongodb+srv://Ram:ram12345678@cluster0.fh8ns3a.mongodb.net/";
mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Connected to MongoDB!");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
  });
// app.use(
//   session({
//     secret:'your-secret-key',
//     resave:false,
//     saveUninitialized:true,
//     cart: [],
//     users: [],
//   })
// );



  // This below code is for getting all Product from Database
  app.get('/getProducts', async (req, res) => {
    try {
      const products = await ProductModel.find();
      console.log(products);
      if (products.length === 0) {
        return res.status(404).json({ message: 'No products found.' });
      }
       res.json(products);
    } catch (err) 
    {
      res.status(500).json({ error: err.message });
    }
  });
  //This code will send categorised products.
  app.get('/getProductsByCategory/:category', async (req, res) => {
    const category = req.params.category;
  
    try {
      const products = await ProductModel.find({ Category: category });
  
      if (products.length === 0) {
        return res.status(404).json({ message: `No products found in the category: ${category}.` });
      }
  
      res.json(products);
    } catch (err) {
      console.error('Error getting products by category:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  


// This will register the user in mongo DB with numerous condition

  app.post('/register',async(req,res) => {
      const {FirstName, LastName, Email, Password} = req.body;
      
      try{
      const hashedPassword = await bcrypt.hash(Password,10);
      //Chaecking for Existing user
      const existingUser = await Usermodel.findOne({ Email });
      if (existingUser) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }
      //Create a new user document in mongoDB
      const newUser = new Usermodel({
        FirstName,
        LastName,
        Email,
        Password: hashedPassword,
      });
  
      await newUser.save();
      res.json({ message: "User registered successfully" });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ error: 'Internal server error during registration.' });
    }
  });

  // This wil used to check the user and do login

  app.post('/signin',async (req,res)=>{
    const {Email, Password} = req.body;
    // const users = req.session.users;
    try{
      const user = await Usermodel.findOne({Email});

      if(!user)
      {
        return res.status(401).json({error: 'Invalid Email or Password'});
      }
      const passwordMatch = await bcrypt.compare(Password, user.Password);
      if(!passwordMatch)
      {
        return res.status(401).json({error: "Invalid Password or Email"});
      }
      
      else if(passwordMatch)
      {
        
        res.json({
          
          message:"Sign in Successfull",
          FirstName:user.FirstName,
          userId:user._id,
          Email:Email,
        });
        
      }
    }
    catch(error)
    {
      console.error('Error during sigin', error);
      res.status(500).json({error: error.message});
    }
  })
//Here Is the Cart Routes
//1 Add a product to user cart
// productId
router.post('/add-to-cart', async(req,res)=>{
  const { userId, productId, quantity } = req.body;
    try{
      const cartItem =  new Cart ({userId , productId, quantity});
        //Check for existing cartItem
      const existingCartItem = await Cart.findOne({ userId, productId });
      if (existingCartItem) {
        const product = await ProductModel.findById(productId);
        if (product) {
          itemPrice = parseFloat(product.Price.replace('$', ''));
  
          // Convert quantity to a number and update the quantity
          const newQuantity = parseInt(quantity);
          existingCartItem.quantity += newQuantity;
  
          // Calculate the new total amount
          const totalAmount = existingCartItem.quantity * itemPrice;
          existingCartItem.totalAmount = totalAmount;
  
          await existingCartItem.save();
          res.json({ message: 'Item quantity updated in the cart' });
        } else {
          // Handle the case where the product with the given productId is not found
          res.status(404).json({ error: 'Product not found' });
        }
      }
      else
      {
        const product = await ProductModel.findById(productId);
      if (product) 
      {
        itemPrice = parseFloat(product.Price.replace('$', ''));
        const newQuantity = parseInt(quantity);
        const newCartItem = new Cart({
          userId,
          productId, 
          quantity,

          totalAmount: newQuantity * itemPrice,
        });
        await newCartItem.save();
        res.json({message:'Item added to the cart'});
      }
      else
      {
        res.status(404).json({error:'product not found'})
      }
    }
    
      
    }
    catch(err)
    {
      console.error(err);
      res.status(500).json({error:'Error adding to cart'});
    }
  
});

//retrive a users cart
router.get('/get-cart/:userId',async(req,res)=>{
  try{
      const userId = req.params.userId;

      //Find all items in the users cart
      const userCart = await Cart.find({userId}).populate('productId');
      res.json(userCart);
  }
  catch(err)
  {
    console.error(err);
    res.status(500).json({error:'Internal server Error'});
  }
});



//remove from cart
router.delete('/remove-from-cart/:userId/:cartItemId', async (req, res) => {
  const userId = req.params.userId;
  const cartItemId = req.params.cartItemId;
  const newQuantity = req.body.newQuantity;
  
  try {
    // Find the cart item by userId and cartItemId
    const cartItem = await Cart.findOne({ userId, _id: cartItemId });

    if (!cartItem) {
      return res.status(404).json({ error: 'Cart item not found.' });
    }
    const product = await ProductModel.findById(cartItem.productId);

    // Check if the new quantity is greater than 1
    if (newQuantity > 1) {
      // Decrement the quantity by the specified amount
      cartItem.quantity -= newQuantity;
    } else if (cartItem.quantity === 1) {
      // If the current quantity is 1, delete the whole product
      await Cart.deleteOne({ userId, _id: cartItemId });
      return res.json({ message: 'Cart item removed successfully.' });
    } else {
      // Decrement the quantity by 1
      cartItem.quantity -= 1;
    }

    // Ensure the quantity is not negative
    cartItem.quantity = Math.max(0, cartItem.quantity);

    // Update the totalAmount based on the new quantity
    const itemPrice = parseFloat(product.Price.replace('$', ''));
    if (!isNaN(itemPrice)) {
      cartItem.totalAmount = cartItem.quantity * itemPrice;
    } else {
      // Handle the case where itemPrice is not a valid number
      console.error('Error: itemPrice is not a valid number');
      console.log('Quantity:', cartItem.quantity);
      console.log('Item Price:',  product.Price.replace('$', ''));
    }
    
   
    // Save the updated cart item
    await cartItem.save();

    res.json({ message: 'Cart item removed successfully.' });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


// Route to handle product creation
app.post('/add/product', upload.fields([
  { name: 'ProductImage1', maxCount: 1 },
  { name: 'ProductImage2', maxCount: 1 },
  { name: 'ProductImage3', maxCount: 1 },
]), async (req, res) => {
  try {
    const {
      Name,
      Price,
      Description,
      Quantity,
      Category,
      Stock,
      Brand,
      ProductImage1,
      ProductImage2,
      ProductImage3,
      ProductImage1Url,
      ProductImage2Url,
      ProductImage3Url,
    } = req.body;

    const productData = {
      Name,
      Price,
      Description,
      Quantity,
      Category,
      Stock,
      Brand,
      ProductImage1: req.files['ProductImage1'] ? req.files['ProductImage1'][0].buffer.toString('base64') : ProductImage1Url,
      ProductImage2: req.files['ProductImage2'] ? req.files['ProductImage2'][0].buffer.toString('base64') : ProductImage2Url,
      ProductImage3: req.files['ProductImage3'] ? req.files['ProductImage3'][0].buffer.toString('base64') : ProductImage3Url,
    };

    const newProduct = await ProductModel.create(productData);
    res.status(201).json(newProduct);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

//REmove product from the Database
app.delete('/remove/product/:id',async(req,res)=>{
  try{
    const productId = req.params.id;

    const existingProducts = await ProductModel.findById(productId);
    if (!existingProducts) {
      return res.status(404).json({ message: 'Product not found' });
    }
    await existingProducts.deleteOne();

    res.status(200).json({ message: 'Product removed successfully' });


  }
  catch(error)
  {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
})

app.get('/register',async(req,res)=>{
    console.log("server is ready")
  })
  app.get('/signin',async(req,res)=>{
    console.log("Signin is ready")
  })
  app.get('/cart/add-to-cart',async(req,res)=>{
  console.log("add to cart is ready")
  })
  app.get('/remove-from-cart',async(req,res)=>
  {
    console.log("remove from cart is working");
  })

  const port = process.env.PORT || 3001; // Use the provided port or a default (e.g., 3001)
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
