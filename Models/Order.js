const mongoose=require('mongoose')
const {Schema,model}=mongoose;

const orderSchema=new Schema({
    title:String,
    description:String,
    image:String,
    price:Number,
    status:String
})

const Order=model('Order',orderSchema)

module.exports=Order;