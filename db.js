const mongoose=require('mongoose')
const error = require('./utils/error')
const connectDB=(connectionStr)=>{
    try{
        return mongoose.connect(connectionStr)
    }catch{
        throw error
    }
}

module.exports=connectDB