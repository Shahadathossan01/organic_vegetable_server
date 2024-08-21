const mongoose=require('mongoose')
const {Schema,model}=mongoose

const cartModel=new Schema({
    userId:String,
    cartQty:Number,
    cart:{
        type:Schema.Types.ObjectId,
        ref:'Product'
    }
})

const Cart=model('Cart',cartModel)

module.exports=Cart;