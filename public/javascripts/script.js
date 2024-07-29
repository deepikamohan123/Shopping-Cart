
      
      function addToCart(proId){
            $.ajax({
                url: '/add-to-cart/'+proId,     //where to go, get method so give id.
                method:'get',
                success:(response) =>{
                    if(response.status){
                        let count=$('#cart-count').html()   //take count from cart-count
                        count=parseInt(count)+1   //convertto integer because it is in string
                        //if(count>2){alert('alraedy')}
                        $('#cart-count').html(count) //set count to cart-count
                    } 
                    //alert(response)
                }
            })
        }

        function changeQuantity(cartId,prodId,userId,count){
            let cartCount=parseInt(document.getElementById('cart-count').innerHTML)
            let quantity=parseInt(document.getElementById(prodId).innerHTML)
            count=parseInt(count)
            $.ajax({
                url:'/change-product-quantity',   //this is post method so give data.
                data:{
                    user:userId,
                    cart:cartId,
                    product:prodId,
                    count:count,
                    quantity:quantity
                },
                method:'post',
                success:(response)=>{
                    if(response.removeProduct){
                        openPopup()
                        //location.reload()   //Inorder to remove, the whole page is refreshed.
                        
                    } else {
                        document.getElementById(prodId).innerHTML=quantity+count
                        document.getElementById('total').innerHTML=response.total   //total is not variable it is kept as static.
                        document.getElementById('cart-count').innerHTML=cartCount+count

                    }

                }
            })
        }

        function removeProduct(cartId,prodId){
            $.ajax({
                url:'/remove-product-from-cart',
                data:{
                    cart:cartId,
                    product:prodId
                },
                method:'post',
                success:(response)=>{
                    if(response.removeProduct){
                        //alert('Product is removed from cart')
                        location.reload()
                    }
                }
            })
        }

        function removeOrder(orderId,userId){
            $.ajax({
                url:'/remove-order',
                data:{
                    order:orderId,
                    user:userId
                },
                method:'post',
                success:(response)=>{
                    if(response.removeOrder){
                        //alert('Product is removed from cart')
                        location.reload()
                    }
                }
            })
        }




