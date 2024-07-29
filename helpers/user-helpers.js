var db= require('../config/connection')   //database management is from this.
var collection=require('../config/collections')
const bcrypt =require('bcrypt')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { response } = require('express');

var instance = new Razorpay({
  key_id: 'rzp_test_VTRSmCsdBgB7Xw',
  key_secret: 'OWDrdpjilUqgmWcNtzP2qnQl',
});

module.exports={
    doSignup:(userData)=>{
        return new Promise(async (resolve,reject)=>{
        userData.password=await bcrypt.hash(userData.password,10) //10 is default salt round which specifies how much time it could take to do hash.
        db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
            resolve(data.ops[0])
        })
        })
    },

    doLogin:(userData)=>{
        return new Promise(async (resolve,reject)=>{
           // let loginStatus=false 
            let response={}
            let user=await db.get().collection(collection.USER_COLLECTION).findOne({email:userData.email})
            if(user){
                bcrypt.compare(userData.password,user.password).then((status)=>{  //compare function is defined using promise so we can use then. 
                    if(status){
                        console.log("login success")
                        response.user=user
                        response.status=true
                        resolve(response)
                    }else {
                        console.log("login failed");
                        resolve({status:false})     //response.status=false resolve(response) - this can be also passed.
                    }
                }) }
            else{
                console.log("login failed");
                resolve({status:false})
            }  

            
        })
    },
    addToCart:(prodId,userId)=>{
        let proObj={
            item:objectId(prodId),
            quantity:1
        }   //create object for each product to get count of each products.
        return new Promise(async (resolve,reject)=>{
            let  userCart = await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(userCart){ 
               let proExist=userCart.products.findIndex(product=>product.item==prodId) //check whether the productId exist to add the quantity of that product. TO find an element is in that array and return the index value use findIndex. The findIndex is like for each function that is it check the element using a variable product and store the prodId in that variable.
               //console.log(proExist) - this will return 0,1,... if product exist else -1 
               if(proExist!=-1){
                db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId),'products.item':objectId(prodId)},
            {
                $inc:{'products.$.quantity':1}    //what to increment and how much.
            }).then(()=>{
                resolve()
            })
               } else{
               db.get().collection(collection.CART_COLLECTION).updateOne({user:objectId(userId)},{
                    //$push:{products:objectId(prodId)}
                    $push:{products:proObj}
                }).then((response)=>{
                    resolve()
                })
            }
            } else {
                let cartObj ={
                    user:objectId(userId),
                    //products:[objectId(prodId)]
                    products:[proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response)=>{
                    resolve()
                })
            } 
        })
    },
    getCartProducts:(userId)=>{
        return new Promise(async (resolve,reject)=>{
           let cartItems=await db.get().collection(collection.CART_COLLECTION).aggregate([  //aggregate used to get all products in cart of that particular user in just one query and not in loops.
            {
                $match:{user:objectId(userId)}    //to find the user from cart. From this we get the cartObj.
          },
          {
            $unwind:'$products'   //to separate each products
          },
          {
            $project:{                              //used to project only the necessary things.
                item:'$products.item',
                quantity:'$products.quantity'
            }
          },
          {
            $lookup:{                           //lookup used to get product as an array.
                from:collection.PRODUCT_COLLECTION,
                localField:'item',    //primary key in sql, that is prodId(item) inside cart.
                foreignField:'_id',    //foreign key in sql, that is _id in product.
                as:'product'          //just give name to array.   

            }
          },
          {
            $project:{
                item:1,          //item already present so set 1 if not need set 0.
                quantity:1,
                product:{$arrayElemAt:['$product',0]}    //$arrayElemAt is used to take object inside an array separately, that is in $products 0th element.
            }
          }
        //   {
        //     $lookup:{     //in sql we say joining 2 table
        //         from:collection.PRODUCT_COLLECTION,  //from were the products need to fetch.
        //         let:{prodList:'$products'},    //the products fetched from cart is stored in a variable prodList. This prodList is an array of products. 
        //         pipeline:[    //pipeline is where we give the condition.
        //             {
        //                 $match:{
        //                     $expr:{   //we need match each product from prodList array using expression.
        //                         $in:['$_id','$$prodList']    //here we check match.
        //                     }
        //                 }       
        //             }
        //         ] ,    //after pipeline we get the list of prodList.
        //         as:'cartItems'   //the name in which the product list should be stored is specified here.
        //     }   
        //   }
           ]).toArray()  
          // console.log(cartItems)
          //console.log(cartItems[0].products)
          // resolve(cartItems[0].products)   //cartItems[0] is the array of cart and next cartItems is the cart of a single user.
          resolve(cartItems)
        })
    },
    getCartCount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let count=0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
            if(cart.products!=0){
                 count=await db.get().collection(collection.CART_COLLECTION).aggregate([  //aggregate used to get all products in cart of that particular user in just one query and not in loops.
                    {
                        $match:{user:objectId(userId)}    //to find the user from cart. From this we get the cartObj.
                  },
                  {
                    $unwind:'$products'   //to separate each products
                  },
                  {
                    $project:{                              //used to project only the necessary things.
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                  },
                  {
                    $lookup:{                           //lookup used to get product as an array.
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',    //primary key in sql, that is prodId(item) inside cart.
                        foreignField:'_id',    //foreign key in sql, that is _id in product.
                        as:'product'          //just give name to array.   
        
                    }
                  },
                  {
                    $project:{
                        item:1,          //item already present so set 1 if not need set 0.
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}    //$arrayElemAt is used to take object inside an array separately, that is in $products 0th element.
                    }
                  },
                  {
                   $group:{    //group is used to all products quantity and price.
                       _id:null,   //unique id is required for group because we identify each group uniquely.
                       count:{$sum:'$quantity'}    //convert to int because price is a string multiplt won't support to string but supports to numeric types.
                   }
                  }
                
                   ]).toArray()  //this is necessary because if not given toArray() it will give a lot of data.
                  
                //count=cart.products.length
                //console.log(cart.products[0].quantity)
                //count=cart.products.length
                resolve(count[0].count)
            }
        }
                resolve(count)
            
            
        })
    },
    changeProductCount:(details)=>{
        details.count=parseInt(details.count)
        details.quantity=parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count==-1 && details.quantity==1){
                db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart)},
            {
                $pull:{products:{item:objectId(details.product)}}
            }).then((response)=>{
                resolve({removeProduct:true})    //this is given to show alert.
            })
            } else {
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
            {
                $inc:{'products.$.quantity':details.count}    //what to increment and how much.
            }).then((response)=>{
                resolve({status:true})
            })
        }
        })
    },

    removeProductFromCart:(details)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLLECTION).updateOne({_id:objectId(details.cart),'products.item':objectId(details.product)},
        {
            $pull:{products:{item:objectId(details.product)}}
        }
        ).then((response)=>{
                resolve({removeProduct:true})
            })
        })
    },

    removeOrderFromOrders:(details)=>{
        
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).removeOne({userId:objectId(details.user),_id:objectId(details.order)}).then((response)=>{
                resolve({removeOrder:true})
            })
        })
    },

    getTotalAmount:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let total=0
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
            if(cart.products!=0){
            total=await db.get().collection(collection.CART_COLLECTION).aggregate([  //aggregate used to get all products in cart of that particular user in just one query and not in loops.
             {
                 $match:{user:objectId(userId)}    //to find the user from cart. From this we get the cartObj.
           },
           {
             $unwind:'$products'   //to separate each products
           },
           {
             $project:{                              //used to project only the necessary things.
                 item:'$products.item',
                 quantity:'$products.quantity'
             }
           },
           {
             $lookup:{                           //lookup used to get product as an array.
                 from:collection.PRODUCT_COLLECTION,
                 localField:'item',    //primary key in sql, that is prodId(item) inside cart.
                 foreignField:'_id',    //foreign key in sql, that is _id in product.
                 as:'product'          //just give name to array.   
 
             }
           },
           {
             $project:{
                 item:1,          //item already present so set 1 if not need set 0.
                 quantity:1,
                 product:{$arrayElemAt:['$product',0]}    //$arrayElemAt is used to take object inside an array separately, that is in $products 0th element.
             }
           },
           {
            $group:{    //group is used to all products quantity and price.
                _id:null,   //unique id is required for group because we identify each group uniquely.
                total:{$sum:{$multiply:['$quantity',{$convert:{input:'$product.price',to:'int'}}]}}    //convert to int because price is a string multiplt won't support to string but supports to numeric types.
            }
           }
         
            ]).toArray()  //this is necessary because if not given toArray() it will give a lot of data.
           
           resolve(total[0].total)
        } 
    }
        resolve(total)
         })
    },
    placeOrder:(order,products,total)=>{
        return new Promise(async(resolve,reject)=>{
            //console.log(order,products,total)
            let status = order['payment-method']==='COD'?'placed':'pending'   //this is conditional operator, if(?) and else(:).
            let orderObj={
                deliveryDetails:{
                    address:order.address,
                    pincode:order.pincode,
                    mobile:order.mobile
                },
                userId:objectId(order.userId),
                date :new Date(),
                paymentMethod:order['payment-method'],   //the payment-method key is in quotes so use this way.
                products:products,
                status:status,
                totalAmount:total
            }
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(order.userId)})
            if(user.deliveryDetails=0){
                 db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(order.userId)},
               
                {
                    $push:{deliveryDetails:{address:order.address,pincode:order.pincode,mobile:order.mobile}}
                })
            } else {
                db.get().collection(collection.USER_COLLECTION).updateOne({_id:objectId(order.userId)},
               
                {
                    $set:{
                        deliveryDetails:{
                            address:order.address,pincode:order.pincode,mobile:order.mobile
                        }
                    }
                })
                
            }


           
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{  //this response contain all data.

              db.get().collection(collection.CART_COLLECTION).removeOne({user:objectId(order.userId)})
                resolve(response.ops[0]._id)   //orderId is resolved, this will reach inside then() in user.js.
                //console.log(response.ops[0])
            })
        })
    },
    getDeliveryDetails:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let user= await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)})
            if(user.deliveryDetails!=0){
                await db.get().collection(collection.USER_COLLECTION).findOne({_id:objectId(userId)}).then((response)=>{
                    console.log(response.deliveryDetails)
                    resolve(response.deliveryDetails)
                })
            }
            
        })
    },

    getCartProductList:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart= await db.get().collection(collection.CART_COLLECTION).findOne({user:objectId(userId)})
            if(cart){
                resolve(cart.products)
            }
            
        })
    },

    getUserOrders:(userId)=>{
        return new Promise(async (resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
    },

    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems= await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match:{_id:objectId(orderId)}
                },
                {
                    $unwind:'$products'
                },
                {
                    $project:{
                        item:'$products.item',
                        quantity:'$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from:collection.PRODUCT_COLLECTION,
                        localField:'item',
                        foreignField:'_id',
                        as:'product'
                    }
                },
                {
                    $project:{
                        item:1,
                        quantity:1,
                        product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            //console.log(cartItems)
            resolve(cartItems)
        })
    },
    generateRazorpay:(orderId,total)=>{
        return new Promise((resolve,reject)=>{
            var options ={
                amount:total*100,      //Amount is in the smallest currency unit so multiply it with 100. 
                currency:'INR',
                receipt:orderId,
            }
            instance.orders.create(options,(err,order)=>{    //this is a callback function.
                resolve(order)
            })
        })
    },

    verifyPayment:(details)=>{
        return new Promise((resolve,require)=>{
            //console.log(details)
            //console.log(details['payment[razorpay_order_id]'])
            //const crypto = require('crypto') - add this module in top because we do not have to export this.
            //const { createHmac } = require('node:crypto');

            hmac = crypto.createHmac('sha256','OWDrdpjilUqgmWcNtzP2qnQl')
            .update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
             .digest('hex')
    
            if(hmac==details['payment[razorpay_signature]']){
                
                resolve()            
            } else{
                
                reject()
            }

            
        })
    },

    changePaymentStatus:(orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:objectId(orderId)},
            {
                $set:{
                    status:'placed'
                }
            }
        ).then(()=>{
            resolve()
        })
        })
    },
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            //console.log(orders)
            resolve(orders)
        })
    },
    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    getAllUserOrders:(userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders= await db.get().collection(collection.ORDER_COLLECTION).find({userId:objectId(userId)}).toArray()
            resolve(orders)
        })
    }
}