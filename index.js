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
        const user=await User.findOne({email})
        if(!user){
            return res.status(400).json({message:'Invalid Credential'})
        }
        const isMatch=await bcrypt.compare(password,user.password)
        if(!isMatch){
            return res.status(400).json({message:'Invalid Credential'})
        }
        delete user._doc.password;
        return res.status(200).json({message:'Login Successful',user})
    }catch{
        next(error)
    }
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
    console.log(e)
})


// boIYlXXdeyqQ88ZH