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
            fab_list:user.fab_list
        }
        const token=jwt.sign(payload,'secret-key')
        return res.status(200).json({message:'Login Successful',token})
    }catch{
        next(error)
    }
})

app.post('/product',async(req,res,next)=>{
    const {title,description,image,price,hot_deals,sesional,category}=req.body
    try{
        const product=await Product.create({
            title:title,
            description:description,
            image:image,
            price:price,
            hot_deals:hot_deals,
            sesional:sesional,
            category:category
        })
        res.status(200).json(product)
    }catch{
        next(error)
    }
})



app.post('/order/:userId',async(req,res,next)=>{
    const id=req.params.userId
    const {title,description,image,price}=req.body
    try{    
        const order=await Order.create({
            title:title,
            description:description,
            image:image,
            price:price,
            status:'panding'
        })
        const user=await User.findById(id)
        user.order_list.push(order._id)
        await user.save()
        res.status(200).json(order)
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
