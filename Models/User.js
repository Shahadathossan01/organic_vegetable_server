const mongoose=require('mongoose')
const {Schema,model}=mongoose
const userSchema=new Schema({
    username:String,
    email:String,
    password:String,
    order_list:[{
        type:Schema.Types.ObjectId,
        ref:'OderList'
    }],
    fab_list:[{
        type:Schema.Types.ObjectId,
        ref:'Product'
    }]
})

const User=model('User',userSchema)

module.exports=User