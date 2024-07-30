const mongoClient = require('mongodb').MongoClient
const state={     //this is an object created for db
    db:null
}

module.exports.connect = function(done){   //done is callback
    const url = 'mongodb://localhost:27018'
    const dbname='shopping'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)  //the db name with data is stored in object db
    done()
    })

    
}

module.exports.get = function(){
    return state.db             //to get the db get function is used.
}

//const {MongoClient}= require('mongodb')
// try{
//     console.log(req.body) 
//     const url ="mongodb://127.0.0.1:27017"
//     const client = new MongoClient(url)
 
//     await client.connect()
 
//     client.db("sample").collection('user').insertOne(req.body)
 
//     console.log(" Database Connected")
//    } catch (error){
//      console.error("An error occured: ",error)
//      res.status(500).send("Internal Server Error")
//    }
//     res.send("got it")
//    })
