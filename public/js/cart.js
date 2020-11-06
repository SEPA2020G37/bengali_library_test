const CART = {
    KEY: "NKMP1f2fURy22lhodDUaXgyT",
    CONTENTS: [],
    init(){
        let _contents = localStorage.getItem(CART.KEY);
        if(_contents) CART.CONTENTS = JSON.parse(_contents);
    },
    sync(){
        localStorage.setItem(CART.KEY, JSON.stringify(CART.CONTENTS));
    },
    find(id){
        CART.init();
        let match = CART.CONTENTS.filter(item => {
            if(item.id == id)
                return true;
        });
        if(match && match[0])
            return match[0];
    },
    add(product){
        if(!CART.find(product.id)){
            let item = {
                id: product.id,
                name: product.name,
                qty: product.qty,
                price: product.price,
                imgUrl: product.image
            }
            CART.init();
            CART.CONTENTS.push(item);
            CART.sync();
        }
    },
    remove(id){
        CART.init()
        CART.CONTENTS = CART.CONTENTS.filter(item => {
            if(item.id !== id)
                return true;
        });
        CART.sync();
    },
    clear(){
        CART.CONTENTS = [];
        CART.sync();
    },
    getAll(){
        CART.init();
        return CART.CONTENTS;
    }
}

addToCartListner();

$('#viewCart').on('click', function(event){
    try{
        let cartNotEmpty = true;
        let subtotal = 0;
        let cart = $('.cart');
        let template = $('.cart-item-card').first().clone();
        cart.empty();
        let cartItems = CART.getAll();
        if(Array.isArray(cartItems) && cartItems.length){
            cartItems.forEach((item) => {
                let card = template.clone();
                card.removeAttr('hidden');
                card.find('.card-book-title').text(item.name);
                card.find('.card-book-price').text(item.price);
                card.find('.card-book-qty').text(item.qty);
                card.find('img').attr('src', item.imgUrl);
                card.find('.hidden-book-id').attr('value', item.id);
                card.find('.remove').attr('onclick', `removeItemFromCart(${item.id})`);
                cart.append(card);
                subtotal += parseFloat(item.price);
            });
            cartNotEmpty = false;
        }
        $('#subtotal').text(`$${subtotal.toFixed(2)}`);
        $('.proceed-to-checkout').prop('disabled', cartNotEmpty);
        $('.cart-main').toggleClass('cart-show');
        $('.main').toggleClass('dark-mask');
    }catch(err){
        if(err) console.log(err);
    }
});

$('.clear-cart').on('click', function(event){
    CART.clear();
    $('.cart').empty();    
    $('#subtotal').text(`$0`);
    $('.proceed-to-checkout').prop('disabled', true);
})

function removeItemFromCart(id){
    let subtotal = 0;
    CART.remove(id);
    let cart = CART.getAll();

    $('.cart-item-card').each(function(){
        let card = $(this).find('input[type=text]');
        if(card[0].value == id){
            card.parent().parent().remove();
        }
    });
    if(!cart.length){
        $('.proceed-to-checkout').prop('disabled', true);
        $('#subtotal').text(`$0`);
    }else{
        for(let item of cart){
            subtotal += parseFloat(item.price);
        }
        $('#subtotal').text(`$ ${subtotal.toFixed(2)}`);
    }
}


// Stripe code
var stripeHandler = StripeCheckout.configure({
    key: secretKey,
    locale: 'auto',
    token: function(token){
        toggleProcessingAnimation({ state: 'start' });
        let cart = CART.getAll();
        fetch('/purchase', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                stripeTokenId: token.id,
                items: cart
            })
        })
        .then(response => {
            return response.json()
        })
        .then(data => {
            if(data.transactionComplete){
                toggleProcessingAnimation({ state: 'end' });
                $('#purchaseCompleteModal').modal('show');
                CART.clear();
                $( "#viewCart" ).trigger( "click" );
                setTimeout(function() {$('#purchaseCompleteModal').modal('hide');}, 3000);
            }
        })
    }
});

let x = $('.proceed-to-checkout').on('click', function(){
    let subtotal = 0;
    let cart = CART.getAll();

    for(let item of cart){
        subtotal += parseFloat(item.price);
    }

    stripeHandler.open({
        amount: subtotal * 100
    });
});

// Book Filter Code
$('#search-bar').on("change", function(event){
    let url = `/find-book?`;
    let urlsearchParams = new URLSearchParams();
    urlsearchParams.append('string', $(this).val());
    url += urlsearchParams.toString();
    fetch(url)
    .then(response => {
        return response.json();
    })
    .then(books => {
        updateStoreGrid(books);
    })
    .catch(err => {
        console.log(err);
    })
});

$('input[name=genre]').on('change', function(event){
    let url = `/find-book-by-genre?`;
    let usp = new URLSearchParams();
    $.each($("input[name=genre]:checked"), function(){
        usp.append('genre[]', $(this).val());
    });
    console.log(usp.toString());
    url += usp.toString();
    fetch(url)
    .then(response => {
        return response.json();
    })
    .then(books => {
        updateStoreGrid(books);
    })
    .catch(err => {
        if(err) throw err;
    })
});

// Vanilla JS functions
function addToCartListner(){
    $('.add-to-cart').on('click', function(event){
        let userId = $(this).data('user-id');
        let bookId = $(this).data('book-id');
        let bookTitle = $(this).data('book-title');
        let bookPrice = $(this).data('book-price');
        let bookImage = $(this).data('book-img');
        let url = window.location.origin + '/book-owned?';
        let UrlSearchParams = new URLSearchParams();
        UrlSearchParams.append('bookId', bookId);
        UrlSearchParams.append('userId', userId);
        url += UrlSearchParams.toString(); 
        fetch(url)
        .then(response => { 
            return response.json()
        })
        .then(data => {
            if(!data){
                let item = {
                    id: bookId,
                    name: bookTitle,
                    qty: 1,
                    price: bookPrice,
                    image: bookImage
                }
                CART.add(item);
            }else{
                $('#bookOwnedModal').modal('show');
            }
        })
        .catch(err => {
            console.log(err);
        })
    });
}

function updateStoreGrid(books){
    let parent = $('.book-store-book-grid');
    let template = $('.book-card').first();
    parent.empty();
    for(let book of books){
        let newCard = template.clone();
        let bookCover = `https://${book.isbn}.s3.amazonaws.com/${book.isbn}-1.jpg`;
        newCard.find('.book-title').text(book.title);
        newCard.find('.book-img').attr('src', bookCover);
        newCard.find('.price-of-price').text(`$${book.price}`);
        let addToCart = newCard.find('.add-to-cart');
        if(addToCart){
            addToCart.attr('data-book-id', book.id);
            addToCart.attr('data-book-title', book.title);
            addToCart.attr('data-book-price', book.price);
            addToCart.attr('data-book-img', bookCover);
            addToCart.attr('data-book-img', bookCover);
        }
        newCard.find('.view-book-details').attr('onclick', `window.location.href='/view?data=${book.isbn}';`);
        parent.append(newCard);
    }
    addToCartListner();
}