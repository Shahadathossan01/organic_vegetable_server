const mongoose=require('mongoose')
const {Schema,model}=mongoose
const userSchema=new Schema({
    username:String,
    email:String,
    password:String,
    order_list:[{
        type:Schema.Types.ObjectId,
        ref:'Order'
    }],
    fab_list:[{
        type:Schema.Types.ObjectId,
        ref:'Product'
    }],
    cart:[{
        type:Schema.Types.ObjectId,
        ref:'Cart'
    }]
})

const User=model('User',userSchema)

module.exports=User