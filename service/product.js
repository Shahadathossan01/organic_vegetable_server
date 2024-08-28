const Product = require("../Models/Product")

const createProductService=async()=>{
    const product=await Product.create({
        title:title,
        description:description,
        image:image,
        price:price,
        hot_deals:hot_deals,
        sesional:sesional,
        category:category,
        fav:fav
    })
    return product
}

module.exports={createProductService}