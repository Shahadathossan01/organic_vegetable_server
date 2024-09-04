const Order = require("../Models/Order");
const User = require("../Models/user");
const calculate = require("../utils");
const { v4: uuidv4 } = require('uuid');
const error = require("../utils/error");
const SSLCommerzPayment = require('sslcommerz-lts')
require('dotenv').config()
const store_id = process.env.STORE_ID
const store_passwd = process.env.STORE_PASSED
const is_live = false //true for live, false for sandbox
const placeOrderController=async(req,res,next)=>{
    const id=req.params.userId
    const {cartItem,fullName,phone,address,status}=req.body
    const cartCalculate=calculate(cartItem)
    const tranId = uuidv4();
    try{ 
        const data = {
            total_amount: cartCalculate.total,
            currency: 'BDT',
            tran_id: tranId, // use unique tran_id for each api call
            success_url: 'http://localhost:3000/payment/success',
            fail_url: 'http://localhost:3000/payment/fail',
            cancel_url: 'http://localhost:3000/payment/cancel',
            ipn_url: 'http://localhost:3030/ipn',
            shipping_method: 'Courier',
            product_name: 'Computer.',
            product_category: 'Electronic',
            product_profile: 'general',
            cus_name: fullName,
            cus_email: 'customer@example.com',
            cus_add1: address,
            cus_add2: 'Dhaka',
            cus_city: 'Dhaka',
            cus_state: 'Dhaka',
            cus_postcode: '1000',
            cus_country: 'Bangladesh',
            cus_phone: phone,
            cus_fax: '01711111111',
            ship_name: 'Customer Name',
            ship_add1: 'Dhaka',
            ship_add2: 'Dhaka',
            ship_city: 'Dhaka',
            ship_state: 'Dhaka',
            ship_postcode: 1000,
            ship_country: 'Bangladesh',
        };
        const sslcz = new SSLCommerzPayment(store_id, store_passwd, is_live)
        sslcz.init(data).then(apiResponse => {
            // Redirect the user to payment gateway
            let GatewayPageURL = apiResponse.GatewayPageURL
            res.status(200).json({url:GatewayPageURL})
        });

        app.post("/payment/success",async(req,res,next)=>{
            try{
                const order=await Order.create({
                    cartItem:cartItem,
                    fullName:fullName,
                    phone:phone,
                    address:address,
                    status:'payed',
                    totalAmount:cartCalculate.total,
                    totalQty:cartCalculate.quantity

                })
                const user=await User.findById(id)
                user.order_list.push(order._id)
                await user.save()
                if(order){
                    res.redirect('http://localhost:5173/paymentSuccess')
                }
            }catch{
                next(error)
            }
        })
        app.post("/payment/fail",async(req,res,next)=>{
            res.redirect('http://localhost:5173/paymentFail')
        })
        app.post("/payment/cancel",async(req,res,next)=>{
            res.redirect('http://localhost:5173/paymentCalcel')
        })
    }catch{
        next(error)
    }
}

module.exports={placeOrderController}