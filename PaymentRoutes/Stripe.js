
const express = require("express");
const Stripe = require("stripe"); 
require("dotenv").config();
const stripe = Stripe(process.env.STRIPE_KEY);

const router = express.Router()

router.post('/create-checkout-session', async (req, res) => {
    const line_items = req.body.cartItems.map(item =>{
        console.log(item.productId.Price);
        const numericPrice = parseFloat(item.productId.Price.replace('$', ''));
        return{
            price_data:{
                currency:"cad",
                product_data:{
                    name:item.productId.Name,
                },
                unit_amount: Math.round(numericPrice * 100),
                // Here I want change string and remove $ sign
                // unit_amount: unitAmount,
            },
            quantity: item.quantity,
        }
    });
    const session = await stripe.checkout.sessions.create({
        line_items,
      mode: 'payment',
      //this where payment success is redirectd.
      
      success_url: `${process.env.CLIENT_URL}/namaste/checkout-success`,
      cancel_url: `${process.env.CLIENT_URL}/cart`,
    });
  
    res.send({url: session.url});
  });
  module.exports = router;