const calculate=(cartData)=>{
    let {total,quantity}=cartData.reduce((acc,cur)=>{
        const price=cur.cart.price;
        const qty=cur.cartQty;
        const itemTotal=price*qty

        acc.total+=itemTotal;
        acc.quantity+=qty

        return acc;
    },{
        total:0,
        quantity:0
    })

    return {total,quantity}
}

module.exports=calculate;