const mongoose=require('mongoose')
const express=require('express')
const app=express()
const cors=require('cors')
const connectDB = require('./db')
require('dotenv').config()
const error = require('./utils/error')
require('dotenv').config()
const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASSED
const is_live = false //true for live, false for sandbox
const port=process.env.PORT
const dataBaseUrl=process.env.DATABASE_URL
app.use(cors())
app.use(express.json())
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const authenticate = require('./middleware/authenticate')
const User = require('./Models/user')
const Product = require('./Models/Product')
const Order = require('./Models/Order')
const Cart = require('./Models/Cart')
const Review = require('./Models/Review')
const calculate = require('./utils')
const { v4: uuidv4 } = require('uuid');
const { registerController, loginController, userByIdController } = require('./controller/auth')
const { createProductController, getProductController, getProductByIdController, addToCartController, addFavController } = require('./controller/product')
const { getCartController, deleteCartController, incrementProductQty, decrementProductQty, deleteAllCart } = require('./controller/cart')
const { placeOrderController } = require('./controller/order')

app.get('/health',(req,res)=>{
    try{
        res.status(200).json('Good Health. Best of luck!')
    }catch{
        next(error)
    }

})

app.post('/register',registerController)
app.post('/login',loginController)
app.get('/user/:id',userByIdController)

app.post('/product',createProductController)
app.get('/product',getProductController)
app.get('/product/:productId',getProductByIdController)
app.post('/addToCart/:productId/:userId',addToCartController)
app.post('/addFav/:productId/:userId',addFavController),

app.get('/cart',getCartController)
app.delete('/cart/:id',deleteCartController)
app.patch('/cartQtyIncrement/:cartId', incrementProductQty);
app.patch('/cartQtyDecrement/:cartId',decrementProductQty);
app.delete('/deleteAllCart',deleteAllCart)

app.post('/order/:userId',async(req,res,next)=>{
    const id=req.params.userId
    const {cartItem,fullName,phone,address,status}=req.body
    const cartCalculate=calculate(cartItem)
    const tranId = uuidv4();
    try{ 
        const data = {
            total_amount: cartCalculate.total,
            currency: 'BDT',
            tran_id: tranId, // use unique tran_id for each api call
            success_url: 'http://localhost:3000/payment/success',
            fail_url: 'http://localhost:3000/payment/fail',
            cancel_url: 'http://localhost:3000/payment/cancel',
            ipn_url: 'http://localhost:3030/ipn',
            shipping_method: 'Courier',
            product_name: 'Computer.',
            product_category: 'Electronic',
            product_profile: 'general',
            cus_name: fullName,
            cus_email: 'customer@example.com',
            cus_add1: address,
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: phone,
            cus_fax: '01711111111',
            ship_name: 'Customer Name',
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
        };
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
        sslcz.init(data).then(apiResponse => {
            // Redirect the user to payment gateway
            let GatewayPageURL = apiResponse.GatewayPageURL
            res.status(200).json({url:GatewayPageURL})
        });

        app.post("/payment/success",async(req,res,next)=>{
            try{
                const order=await Order.create({
                    cartItem:cartItem,
                    fullName:fullName,
                    phone:phone,
                    address:address,
                    status:'payed',
                    totalAmount:cartCalculate.total,
                    totalQty:cartCalculate.quantity

                })
                const user=await User.findById(id)
                user.order_list.push(order._id)
                await user.save()
                if(order){
                    res.redirect('http://localhost:5173/paymentSuccess')
                }
            }catch{
                next(error)
            }
        })
        app.post("/payment/fail",async(req,res,next)=>{
            res.redirect('http://localhost:5173/paymentFail')
            
        })
        app.post("/payment/cancel",async(req,res,next)=>{
            res.redirect('http://localhost:5173/paymentCalcel')
        })
    }catch{
        next(error)
    }
})
app.delete('/order/:orderId',async(req,res,next)=>{
    const {orderId}=req.params
    try{
        const data=await Order.findById(orderId).deleteOne()
        res.status(200).json(data)
    }catch{
        next(error)
    }
})
app.get('/order',async(req,res,next)=>{
    try{
        const orders=await Order.find()
        res.status(200).json(orders)
    }catch{
        next(error)
    }
})

app.post('/review/:productId',async(req,res,next)=>{
    const {author,ratting,comments}=req.body
    const {productId}=req.params
    try{
        const review=await Review.create({
            author:author,
            ratting:ratting,
            comments:comments
        })
        const product=await Product.findById(productId).updateOne({
            $push: {review: review._id}
        })
        res.status(200).json(review)
    }catch{
        next(error)
    }
})
app.patch('/review/:id',async(req,res,next)=>{
    const {id}=req.params;
    const {ratting,comments}=req.body
    try{
        const updateReview=await Review.findById(id).updateMany({
            $set:{ratting,comments}
        })
        res.status(200).json(updateReview)
    }catch(error){
        res.status(500).json({message:'Review not found',error})
    }

})

app.get('/private',authenticate,async(req,res)=>{
    return res.status(200).json({message:'I am a private route'})
})

app.use((err,req,res,next)=>{
    const message=err.message?err.message:'Server Error Occured'
    const status=err.status?err.status:500;
    res.status(status).json({message})
})

connectDB(`${dataBaseUrl}organic_vetetables`)
.then(()=>{
    console.log('Database Connected')
    app.listen(port,()=>{
        console.log('server is running')
    })
})
.catch((e)=>{
    throw error()
})
