const mongoose=require('mongoose')
const {Schema,model}=mongoose
const productSchema=new Schema({
    title:String,
    description:String,
    image:String,
    price:Number,
    hot_deals:Boolean,
    sesional:Boolean,
    category:String,
    fav:Boolean,
    review:[{
        type:mongoose.Types.ObjectId,
        ref:'Review'
    }]
})

const Product=model('Product',productSchema)

module.exports=Product;