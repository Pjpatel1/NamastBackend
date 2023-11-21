
const express = require("express");
const Stripe = require("stripe"); 
require("dotenv").config();
const stripe = Stripe(process.env.STRIPE_KEY);

const router = express.Router()

router.post('/webhook',async (req,res)=>{
  console.log('webhook recived')
    const payload = req.rawBody;
    const sig = req.headers['stripe-signature'];
    try{
      const event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_ENDPOINT_SECRET);
      console.log('I am try')
      if (event.type === `invoice.payment_succeeded`)
      {
        //Extract the invoice object from the event
        const invoice = event.data.object;

        //Extract the customer's email form the invoice
        const customerEmail = invoice.customer_email;

        //log Cutomers email to console
        console.log('Invoice payment succeeded for customer:', customerEmail);
        console.log('Invoice:', invoice);

        // sendInvoiceToCustomer(customerEmail);
      }
      res.status(200).end();
    }catch (err)
    {
      console.error('webhook Error', err.message);
      res.status(400).send(`webhook error: ${err.message}`);
    }    

});

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