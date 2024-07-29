var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
var userHelper = require('../helpers/user-helpers');
var adminHelper=require('../helpers/admin-helpers')
const verifyLogin=(req,res,next)=>{
  if(req.session.adminLoggedIn){
    next()
  } else {
   // res.redirect('/admin ')   //only use /login because we redirect to already rendered page not need to use 'user/login'
   res.render('admin/login',{"loginError":req.session.adminLoginErr,admin:true})
  }
}


/* GET users listing. */
router.get('/view-products',verifyLogin, function(req, res, next) {
  productHelper.getAllProducts().then((products)=> {
    //console.log(products)
    res.render('admin/view-products',{adm,products,admin:true})
  })
  
});
router.get('/',async(req,res) =>{
  if(req.session.admin){
    // productHelper.getAllProducts().then((products)=> {
    //   //console.log(products)
    //   res.render('admin/view-products',{adm,products,admin:true})
    // })
    // res.redirect('/view-products')
    await adminHelper.getAllAdmin().then((admins)=>{
      res.render('admin/admin',{admins,adm,admin:true})
    })
    
  }else{
    res.render('admin/login',{"loginError":req.session.adminLoginErr,admin:true})
    req.session.adminLoginErr=false   //cannot give req.session.user.loginErr because the req.session.user is set null loginErr will also be null.
  }
})

router.post('/',(req,res)=>{
  adminHelper.doLogin(req.body).then(async(response)=>{
    if(response.status){
      req.session.adminLoggedIn=true
      req.session.admin=response.admin
      adm =req.session.admin
      // productHelper.getAllProducts().then((products)=> {
      //   //console.log(products)
      //   res.render('admin/view-products',{adm,products,admin:true})
      // })
      await adminHelper.getAllAdmin().then((admins)=>{
        res.render('admin/admin',{admins,adm,admin:true})
      })
    }else {
      req.session.adminLoginErr=true  //req.session.user.loginErr="Invalid username or password."
      res.render('admin/login',{"loginError":req.session.adminLoginErr,admin:true})
      req.session.adminLoginErr=false 
    }
  })
})

router.get('/logout',(req,res)=>{
  //req.session.destroy() //destroy the session.
  
  req.session.admin=null  //rather than destroy the session, just keep it null.
  req.session.adminLoggedIn=false
  res.render('admin/login',{"loginError":req.session.adminLoginErr,admin:true})
  req.session.adminLoginErr=false   
})

router.get('/add-admin',verifyLogin,function(req,res){
  res.render('admin/add-admin',{admin:true,adm})
})
router.post('/add-admin',verifyLogin, async (req,res)=>{
  //console.log(req.body)
  //console.log(req.files.image) //to get image.
 await adminHelper.addAdmin(req.body).then((id)=> { //id is returned using callback from product-helpers.js.
    let image= req.files.image
    image.mv('./public/admin-images/'+id+'.jpg') //move function is used using middleware fileUpload. Stored in public folder because this is static and should be used in hbs files.
        //res.render('admin/add-product',{admin:true,adm})
        res.redirect('/admin')    
    
  })
})

router.get('/remove-admin/:id',verifyLogin,(req,res)=>{
  let admId=req.params.id      //for post method we can use req.body but here get method so use req.params.id because we are passing value through url.
  //prodId=req.query.id
  //console.log(prodId)
  //console.log(req.query.name)
  adminHelper.removeAdmin(admId).then((response)=> {
    //('./public/product-images/'+prodId+'.jpg')
    res.redirect('/admin')
  })


})

router.get('/edit-admin/:id',verifyLogin,(req,res)=> {
  let admins = adminHelper.getAdminDetails(req.params.id).then((admins)=>{
    res.render('admin/edit-admin',{admins,admin:true,adm})
  })
  
})

router.post('/edit-admin/:id',verifyLogin,async (req,res)=> {
  await adminHelper.updateAdmin(req.params.id,req.body).then(()=>{
    res.redirect('/admin')     //uploading can be done in background so give redirect before uploading the file because uploading is done by server, if browser is close the uploading will not happen.
 if(req.files && req.files.image){
      let image =req.files.image
      image.mv('./public/admin-images/'+req.params.id+'.jpg')
    } 
  })
    
  
})

router.get('/add-product',verifyLogin,function(req,res){
  res.render('admin/add-product',{admin:true,adm})
})
router.post('/add-product',verifyLogin,(req,res)=>{
  //console.log(req.body)
  //console.log(req.files.image) //to get image.
  productHelper.addProduct(req.body,(id)=> { //id is returned using callback from product-helpers.js.
    let image= req.files.image
    image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{ //move function is used using middleware fileUpload. Stored in public folder because this is static and should be used in hbs files.
      if(!err){
        //res.render('admin/add-product',{admin:true,adm})
        productHelper.getAllProducts().then((products)=> {
          //console.log(products)
          res.render('admin/view-products',{adm,products,admin:true})
        })
      }else{
        console.log(err)
      }
    })     
    
  })
})

router.get('/delete-product/:id',verifyLogin,(req,res)=>{
  let prodId=req.params.id      //for post method we can use req.body but here get method so use req.params.id because we are passing value through url.
  //prodId=req.query.id
  //console.log(prodId)
  //console.log(req.query.name)
  productHelper.deleteProduct(prodId).then((response)=> {
    //('./public/product-images/'+prodId+'.jpg')
    // res.redirect('/view-products')
    productHelper.getAllProducts().then((products)=> {
      //console.log(products)
      res.render('admin/view-products',{adm,products,admin:true})
    })
  })


})

router.get('/edit-product/:id',verifyLogin,(req,res)=> {
  let product = productHelper.getProductDetails(req.params.id).then((product)=>{
    res.render('admin/edit-product',{product,admin:true,adm})
  })
  
})

router.post('/edit-product/:id',verifyLogin,(req,res)=> {
  productHelper.updateProduct(req.params.id,req.body).then(()=>{
         //uploading can be done in background so give redirect before uploading the file because uploading is done by server, if browser is close the uploading will not happen.
      productHelper.getAllProducts().then((products)=> {
    //console.log(products)
    res.render('admin/view-products',{adm,products,admin:true})
  })
    if(req.files && req.files.image){      //check if the image is already present.
      let image=req.files.image
      image.mv('./public/product-images/'+req.params.id+'.jpg')
    }
    
  })
    
  
})

router.get('/orders',verifyLogin,(req,res)=>{
  userHelper.getAllOrders().then((orders)=>{
    res.render('admin/orders',{orders,admin:true,adm})
  })
 
})

router.get('/view-order-products/:id',verifyLogin,async (req,res,next)=>{
  let products=await userHelper.getOrderProducts(req.params.id)
  //console.log(products)
  res.render('admin/view-order-products',{products,admin:true,adm})
})

router.get('/users',verifyLogin,(req,res)=>{
  userHelper.getAllUsers().then((users)=>{
    res.render('admin/users',{users,admin:true,adm})
  })
  
})

router.get('/view-orders/:id',verifyLogin,async (req,res,next)=>{
  let orders=await userHelper.getAllUserOrders(req.params.id)
  //console.log(products)
  res.render('admin/view-orders',{orders,admin:true,adm})
})

module.exports = router;
