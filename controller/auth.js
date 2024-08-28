const { registerService, loginService } = require("../service/auth")
const error = require("../utils/error")

const registerController=async(req,res,next)=>{
    const {username,email,password}=req.body
    if(!username || !email || !password){
        return res.status(400).json({message:'Invalid Data'})
    }
    try{
        console.log('inside')
        let user=await registerService(username,email,password)
        return res.status(201).json({message:'user created successfully',user})
    }catch{
        next(error)
    }
}

const loginController=async(req,res,next)=>{
    const {email,password}=req.body
    if(!email || !password){
        return res.status(400).json({message:'Invalid Data'})
    }
    try{
       const {payload,token}=await loginService(email,password)
        return res.status(200).json({message:'Login Successful',token,payload})
    }catch{
        next(error)
    }
}
module.exports={registerController,loginController}