const mongoose=require('mongoose')
const {Schema,model}=mongoose;

const orderSchema=new Schema({
    cartItem:Array,
    fullName:String,
    phone:String,
    address:String,
    status:{
        type:String,
        enum:['panding','payed'],
        default:'panding'
    },



})

const Order=model('Order',orderSchema)

module.exports=Order;