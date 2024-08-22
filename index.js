const express=require('express')
const app=express()
const cors=require('cors')
const connectDB = require('./db')
const error = require('./utils/error')
const User = require('./Models/user')
const port=3000
app.use(cors())
app.use(express.json())
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const authenticate = require('./middleware/authenticate')
const Product = require('./Models/Product')
const Order = require('./Models/Order')
const Cart = require('./Models/Cart')

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
    try{    
        const order=await Order.create({
            cartItem:cartItem,
            fullName:fullName,
            phone:phone,
            address:address
        })
        const user=await User.findById(id)
        user.order_list.push(order._id)
        await user.save()
        res.status(200).json(order)
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
