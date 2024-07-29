var express = require('express');
var router = express.Router();
var productHelper = require('../helpers/product-helpers');
var userHelper = require('../helpers/user-helpers');
const verifyLogin=(req,res,next)=>{
  if(req.session.userLoggedIn){
    next()
  } else {
    res.redirect('/login')   //only use /login because we redirect to already rendered page not need to use 'user/login'
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user=req.session.user
  let cartCount= null
  if(req.session.user){
  cartCount= await userHelper.getCartCount(req.session.user._id)
  productHelper.getAllProducts().then((products)=> {
    res.render('user/view-product',{products,user,cartCount})
  })
  }
  productHelper.getAllProducts().then((products)=> {
    res.render('user/view-product',{products,user,cartCount})
  })
});
  
router.get('/login',(req,res) =>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{"loginError":req.session.userLoginErr})
    req.session.userLoginErr=false   //cannot give req.session.user.loginErr because the req.session.user is set null loginErr will also be null.
  }
})

router.get('/signup',(req,res) =>{
  res.render('user/signup') 
})
 
router.post('/signup',(req,res) =>{
  userHelper.doSignup(req.body).then((response)=>{
    console.log(response)
    req.session.user=true
    req.session.user=response    //not need to give response.user because from doSignup 0th object is directly passed.
    res.redirect('/')
  })
})

router.post('/login',(req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.userLoggedIn=true
      req.session.user=response.user
      res.redirect('/')
    }else {
      req.session.userLoginErr=true  //req.session.user.loginErr="Invalid username or password."
      res.redirect('/login')
    }
  })
})

router.get('/logout',(req,res)=>{
  //req.session.destroy() //destroy the session.
  
  req.session.user=null  //rather than destroy the session, just keep it null.
  req.session.userLoggedIn=false
  res.redirect('/')
})

router.get('/cart',verifyLogin,async (req,res)=> {
  let products = await userHelper.getCartProducts(req.session.user._id)     //the products are taken using the user id.
  let total = await userHelper.getTotalAmount(req.session.user._id)
  cartCount= await userHelper.getCartCount(req.session.user._id)
  res.render('user/cart',{products,user:req.session.user,total,cartCount})
})

router.get('/orders',verifyLogin,async (req,res)=> {
  cartCount= await userHelper.getCartCount(req.session.user._id)
  let orders = await userHelper.getUserOrders(req.session.user._id)
    res.render('user/orders',{orders,user:req.session.user,cartCount})
  
})

router.get('/add-to-cart/:id',(req,res)=>{ //in a cart there will be cart id , user id and the products is pushed in an array. 
  userHelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    res.json({status:true})
   //res.redirect('/')
  })
}) 

router.post('/change-product-quantity',(req,res,next)=>{
  userHelper.changeProductCount(req.body).then(async (response)=>{   //add total as an key of response object.
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)    //In ajax, fullpage is not refreshed that is the data is not returned as full page, instead a small portion is changed, so this case the data is only passed and is converted to object using json.
  })
})

router.post('/remove-product-from-cart',(req,res,next)=>{
  userHelper.removeProductFromCart(req.body).then((response)=>{
    res.json(response)
  })
})
router.post('/remove-order',(req,res,next)=>{
  userHelper.removeOrderFromOrders(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/place-order',verifyLogin,async (req,res,next)=>{
  details = await userHelper.getDeliveryDetails(req.session.user._id)
  cartCount= await userHelper.getCartCount(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{details,total,user:req.session.user,cartCount})
})

router.post('/place-order',async (req,res,next)=>{
  let products=await userHelper.getCartProductList(req.body.userId)
  let total=await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body,products,total).then((orderId)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    } else{
      userHelper.generateRazorpay(orderId,total).then((response)=>{
        res.json(response)
      })
    }
    
  })
 //console.log(req.body)
})

router.get('/view-order-products/:id',async (req,res,next)=>{
  cartCount= await userHelper.getCartCount(req.session.user._id)
  let products=await userHelper.getOrderProducts(req.params.id)
  //console.log(products)
  res.render('user/view-order-products',{products,user:req.session.user,cartCount})
})

router.post('/verify-payment',(req,res,next)=>{
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      res.json({status:true})
    })
    
  }).catch((err)=>{
    res.json({status:false,err:err})
  })
  //console.log(req.body)
})


module.exports = router;
