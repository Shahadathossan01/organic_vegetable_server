const Cart = require("../Models/Cart")

const getCartController=async(req,res,next)=>{
    try{
        const cart=await Cart.find().populate('cart')
        res.status(200).json(cart)
    }catch{
        next(error)
    }
}
const deleteCartController=async(req,res,next)=>{
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
}
const incrementProductQty=async (req, res, next) => {
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
}
const decrementProductQty= async (req, res, next) => {
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
}
const deleteAllCart=async(req,res,next)=>{
    try{
        const result=await Cart.deleteMany({})
        res.status(200).json(result)
    }catch{
        next(error)
    }
}
module.exports={getCartController,deleteCartController,incrementProductQty,decrementProductQty,deleteAllCart}