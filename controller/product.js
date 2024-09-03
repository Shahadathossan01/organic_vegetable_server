const Cart = require("../Models/Cart")
const Product = require("../Models/Product")
const User = require("../Models/user")
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
const addToCartController=async(req,res,next)=>{
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
}
const addFavController=async(req,res,next)=>{
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
}
module.exports={createProductController,getProductController,getProductByIdController,addToCartController,addFavController}