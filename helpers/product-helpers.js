var db= require('../config/connection')   //database management is from this.
var collection=require('../config/collections')
var objectId = require('mongodb').ObjectId
//const bcrypt =require('bcrypt')


module.exports = {
    
    addProduct:(product,callback) => {
        //console.log(product)
        db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data)=>{   //here no promise but still then is used because collection, insert is already defined by promise.
           // console.log(data)   -this will give full details of data in an array.
           //console.log(data) 
           callback(data.ops[0]._id)   //data.ops[0]._id passed to get id to store image because ops is the array that stores exact data.
        })
    },
    getAllProducts:() => {
        return new Promise(async(resolve,reject) => {
            let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).removeOne({_id:objectId(prodId)}).then((response)=> {  //here objectId given because prodId is in string but _id is stored in database as an object.
                resolve(response)    //if this deleted item is useful in any other case.
            })
        })
    },
    getProductDetails:(prodId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).findOne({_id:objectId(prodId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(prodId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({_id:objectId(prodId)},{
                $set:{
                    name:productDetails.name,
                    category:productDetails.category,
                    price:productDetails.price,
                    description:productDetails.description

                }
            }).then((response)=>{
                resolve()
            })
        })
    }
}