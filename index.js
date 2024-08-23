const mongoose=require('mongoose')
const express=require('express')
const app=express()
const cors=require('cors')
const connectDB = require('./db')
const error = require('./utils/error')
const User = require('./Models/user')
const SSLCommerzPayment = require('sslcommerz-lts')
const store_id = 'ownco66c82257a59ad'
const store_passwd = 'ownco66c82257a59ad@ssl'
const is_live = false //true for live, false for sandbox
const port=3000
app.use(cors())
app.use(express.json())
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const authenticate = require('./middleware/authenticate')
const Product = require('./Models/Product')
const Order = require('./Models/Order')
const Cart = require('./Models/Cart')
const calculate = require('./utils')
const { v4: uuidv4 } = require('uuid');
app.get('/health',(req,res)=>{
    try{
        res.status(200).json('Good Health. Best of luck!')
    }catch{
        next(error)
    }

})

app.post('/register',async(req,res)=>{
    const {username,email,password}=req.body

    if(!username || !email || !password){
        return res.status(400).json({message:'Invalid Data'})
    }
    let user=await User.findOne({email})
    if(user){
        return res.status(400).json({message:'user already exists'})
    }

    user=new User({
        username,email,password
    })
    const salt=bcrypt.genSaltSync(10)
    const hash=bcrypt.hashSync(password,salt)
    user.password=hash
    await user.save()
    return res.status(201).json({message:'user created successfully',user})
})
app.post('/login',async(req,res,next)=>{
    const {email,password}=req.body
    try{
        const user=await User.findOne({email}).populate('order_list')
        if(!user){
            return res.status(400).json({message:'Invalid Credential'})
        }
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(400).json({message:'Invalid Credential'})
        }
        const payload={
            _id:user._id,
            username:user.username,
            email:user.email,
            order_list:user.order_list,
            fab_list:user.fab_list,
            cart:user.cart
        }
        const token=jwt.sign(payload,'secret-key')
        return res.status(200).json({message:'Login Successful',token,payload})
    }catch{
        next(error)
    }
})
app.get('/user/:id',async(req,res,next)=>{
    const id=req.params.id
    try{

        const user=await User.findById(id)
        .populate({
            path:'cart',
            populate:{
                path:'cart',
                model:'Product'
            }
        })
        .populate('fab_list')
        .populate('order_list')
        res.status(200).json(user)
    }catch{
        next(error)
    }

})
app.post('/product',async(req,res,next)=>{
    const {title,description,image,price,hot_deals,sesional,category,fav}=req.body
    try{
        const product=await Product.create({
            title:title,
            description:description,
            image:image,
            price:price,
            hot_deals:hot_deals,
            sesional:sesional,
            category:category,
            fav:fav
        })
        res.status(200).json(product)
    }catch{
        next(error)
    }
})
app.get('/product',async(req,res,next)=>{
    try{
        const product=await Product.find()
        res.status(200).json(product)
    }catch{
        next(error)
    }
})
app.post('/addToCart/:productId/:userId',async(req,res,next)=>{
        const {productId,userId}=req.params
       const cart=await Cart.find()
       let count=true;
       let existingCart
       cart.map(item=>{
        if(item.cart._id==productId){
            count=false
            existingCart=item
        }
       })
       if(count){
           const newCart=await Cart.create({
               userId:userId,
               cart:productId,
               cartQty:1
           })
           const user=await User.findById(userId).updateOne({
            $push : {cart:newCart._id}
           })
           res.status(200).json(newCart)
       }else{
        existingCart.cartQty +=1
        await existingCart.save()
       }
})
app.post('/addFav/:productId/:userId',async(req,res,next)=>{
    const {productId,userId}=req.params
    const product=await Product.findById(productId)
    const user=await User.findById(userId)
    if(product.fav){
        const updateUser=await User.findById(userId).updateOne({
            $pull :{fab_list:productId}
        })
        
    }else{
        const updateUser=await User.findById(userId).updateOne({
            $push :{fab_list:productId}
        })
    }
    const updateProduct=await Product.findById(productId).updateOne({
        fav: !product.fav
    })
    res.status(200).json(updateProduct)
}),
app.get('/cart',async(req,res,next)=>{
    try{
        const cart=await Cart.find().populate('cart')
        res.status(200).json(cart)
    }catch{
        next(error)
    }
})

app.delete('/cart/:id',async(req,res,next)=>{
    const id=req.params.id
    try{
        const cart=await Cart.deleteOne({
            _id:id
        })
        res.status(200).json({message:'delete successfully'})
    }
    catch{
        next(error)
    }
})

app.patch('/cartQtyIncrement/:cartId', async (req, res, next) => {
    const { cartId } = req.params;
    try {
        let cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        cart.cartQty += 1;
        await cart.save();
        
        res.status(200).json(cart);
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});
app.patch('/cartQtyDecrement/:cartId', async (req, res, next) => {
    const { cartId } = req.params;
    try {
        let cart = await Cart.findById(cartId);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        if(cart.cartQty>1){
            cart.cartQty -= 1;
            await cart.save();
        }
        
        res.status(200).json(cart);
    } catch (error) {
        next(error); // Pass the error to the next middleware
    }
});
app.delete('/deleteAllCart',async(req,res,next)=>{
    try{
        const result=await Cart.deleteMany({})
        res.status(200).json(result)
    }catch{
        next(error)
    }
})

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
                    status:'payed'
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


app.get('/private',authenticate,async(req,res)=>{
    return res.status(200).json({message:'I am a private route'})
})

app.use((err,req,res,next)=>{
    console.log(err)
    const message=err.message?err.message:'Server Error Occured'
    const status=err.status?err.status:500;
    res.status(status).json({message})
})

connectDB('mongodb+srv://hossantopu:boIYlXXdeyqQ88ZH@cluster0.d6frz.mongodb.net/organic_vetetables')
.then(()=>{
    console.log('Database Connected')
    app.listen(port,()=>{
        console.log('server is running')
    })
})
.catch((e)=>{
    throw error()
})
