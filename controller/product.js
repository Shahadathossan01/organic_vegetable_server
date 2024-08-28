const Product = require("../Models/Product")
const { createProductService } = require("../service/product")

const createProductController=async(req,res,next)=>{
    const {title,description,image,price,hot_deals,sesional,category,fav}=req.body
    try{
        const product=await createProductService(title,description,image,price,hot_deals,sesional,category,fav)
        res.status(200).json(product)
    }catch{
        next(error)
    }
}
const getProductController=async(req,res,next)=>{
    try{
        const product=await Product.find()
        res.status(200).json(product)
    }catch{
        next(error)
    }
}
const getProductByIdController=async(req,res,next)=>{
    const {productId}=req.params
    try{
        const product=await Product.findById(productId).populate('review')
        res.status(200).json(product)
    }catch{
        next(error)
    }
}
module.exports={createProductController,getProductController,getProductByIdController}