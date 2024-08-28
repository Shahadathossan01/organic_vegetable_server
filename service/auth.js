const User = require("../Models/user")
const error = require("../utils/error")
const bcrypt=require('bcryptjs')
const jwt=require('jsonwebtoken')
const registerService=async(username,email,password)=>{
    try{
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
            return user
    }catch(e){
        throw error("server error")
    }
}

const loginService=async(email,password)=>{
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
        return {payload,token}
    }catch(e){
        throw error('server error')
    }
}
module.exports={registerService,loginService}