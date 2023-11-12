const express = require('express');
const bcrypt = require('bcryptjs');
const mongoose  = require ('mongoose')
const { v4: uuidv4 } = require('uuid');
const cors = require ('cors')
const ProductModel = require('./Products')
const Usermodel = require('./User');
const app = express();
const router = express.Router();
const crypto = require('crypto');
const Cart = require('./Cart');
const path = require('path')
app.use(express.static(path.join(__dirname+"/public")))
app.use(cors())
app.use(express.json())
app.use('/cart', router);
// mongoose.connect("mongodb+srv://Namaste:ram123@clusternamaste.iplr4cq.mongodb.net/")
const url = "mongodb+srv://Ram:ram12345678@cluster0.fh8ns3a.mongodb.net/?retryWrites=true&w=majority";
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



  // This below code is for getting Product from Database
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
    cartItem.totalAmount = cartItem.quantity * itemPrice;
    // Save the updated cart item
    await cartItem.save();

    res.json({ message: 'Cart item removed successfully.' });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


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
