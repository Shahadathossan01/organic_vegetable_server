const mongoose=require('mongoose')
const {Schema,model}=mongoose
const reviewSchema=new Schema({
    author:String,
    ratting:Number,
    comments:String
})

const Review=model('Review',reviewSchema)
module.exports=Review;