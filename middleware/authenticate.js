const User = require("../Models/user")
const jwt=require('jsonwebtoken')
const authenticate=async(req,res,next)=>{
    try{
        let token=req.headers.authorization
        if(!token){
            return res.status(401).json({message:'Unauthorized'})
        }
        token=token.split(' ')[1]
        const decoded=jwt.verify(token,'secret-key')
        const user=await User.findById(decoded._id)
        if(!user){
            return res.status(401).json({message:'Unauthorized'})
        }
        req.user=user;
        next()
    }catch{
        return res.status(400).json({message:'Invalid token'})
    }
}

module.exports=authenticate;