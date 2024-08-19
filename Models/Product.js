const mongoose=require('mongoose')
const {Schema,model}=mongoose
const productSchema=new Schema({
    title:String,
    description:String,
    image:String,
    price:Number,
    hot_deals:Boolean,
    sesional:Boolean,
    category:String
})

const Product=model('Product',productSchema)

module.exports=Product;