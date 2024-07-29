var db= require('../config/connection')   //database management is from this.
var collection=require('../config/collections')
var objectId = require('mongodb').ObjectId
const bcrypt =require('bcrypt')

module.exports={
    doLogin:(adminData)=>{
        return new Promise(async (resolve,reject)=>{
           // let loginStatus=false 
            let response={}
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).findOne({email:adminData.email})
            if(admin){
                bcrypt.compare(adminData.password,admin.password).then((status)=>{  //compare function is defined using promise so we can use then. 
                    if(status){
                        console.log("login success")
                        response.admin=admin
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
    getAllAdmin:()=>{
        return new Promise(async(resolve,reject)=>{
            let admin=await db.get().collection(collection.ADMIN_COLLECTION).find().toArray()
            resolve(admin)
        })
    },
    addAdmin:(admin) => {
        return new Promise(async(resolve,reject)=>{
             //console.log(product)
        admin.password= await bcrypt.hash(admin.password,10) 
        await db.get().collection(collection.ADMIN_COLLECTION).insertOne(admin).then((data)=>{   //here no promise but still then is used because collection, insert is already defined by promise.
           // console.log(data)   -this will give full details of data in an array.
           //console.log(data) 
           resolve(data.ops[0]._id)   //data.ops[0]._id passed to get id to store image because ops is the array that stores exact data.
        })
        })
       
    },
    
    removeAdmin:(admId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADMIN_COLLECTION).removeOne({_id:objectId(admId)}).then((response)=> {  //here objectId given because prodId is in string but _id is stored in database as an object.
                resolve(response)    //if this deleted item is useful in any other case.
            })
        })
    },
    getAdminDetails:(admId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADMIN_COLLECTION).findOne({_id:objectId(admId)}).then((admin)=>{
                resolve(admin)
            })
        })
    },
    updateAdmin:(admId,adminDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ADMIN_COLLECTION).updateOne({_id:objectId(admId)},{
                $set:{
                    name:adminDetails.name,
                    email:adminDetails.email,
                    // password:await bcrypt.hash(adminDetails.password,10),
                    description:adminDetails.description

                }
            }).then((response)=>{
                resolve()
            })
        })
    }

}