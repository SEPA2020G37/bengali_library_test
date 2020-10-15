const async = require('async');
const aws = require('../utils/S3');
const db = require('../models/index');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

function createOrder(userId, bookList, totalAmt, res){
    let Order;
    db.Transaction.create({ description: 'Books Purchased', method: 'CARD' })
    .then(transaction => {
        let currDate = new Date();
        let stringDate = `${currDate.getFullYear()}/${currDate.getMonth()}/${currDate.getDate()} ${currDate.getHours()}:${currDate.getMinutes()}:${currDate.getSeconds()}`;
        return db.Order.create({ 
            userId: userId, 
            transactionId: transaction.id, 
            totalPrice: totalAmt, 
            deliveryDate: stringDate, 
            status: 'purchased' 
        })
        .then(order => {
            return order;
        })
    })
    .then(order => {
        let BookIds = [];
        Order = order;
        bookList.forEach((book) => {
            BookIds.push(book.id);
        });
        return db.Book.findAll({ where: { id: { [db.Sequelize.Op.in]: BookIds }}})
        .then(books => {
            return books;
        })
    })
    .then(books => {
        Order.addBooks(books);
        return db.UserBookList.findOne({ where: { userId: userId } })
        .then(ubl => {
            return { books: books, bookList: ubl }
        })
    })
    .then(data => {
        // data.books.forEach((value) => { value.currentPage = 0 });
        data.bookList.addBooks(data.books, { through: { currentPage: 0 } });
        data.bookList.qty = data.bookList.qty + data.books.length;
        data.bookList.save();
        res.send(JSON.stringify({ transactionComplete: true }));
    })
    .catch(err => {
        if(err)
            throw err;
    })
}

// Acepts an offset value and a callback.
// This function retrieves a list of books after the specified offset and calls
// the callback function received passing in te list.
function getBooks(offset, callback){
    db.Book.findAll({ attributes: ['id', 'isbn', 'title', 'description', 'price', 'link', 'createdAt', 'updatedAt'], 
        offset: offset, 
        limit: 20, 
        include: [ { model: db.Vendor }, { model: db.Genre } ]
    })
    .then(books => {
        callback(books);
    })
    .catch(err => {
        if(err) throw err;
    })
}

module.exports.getBookStore = (req, res, next) => {
    getBooks(0, (books) => {
        db.Genre.findAll()
        .then(genre => {
            res.render('book-store', 
                { title: "book Store", user: req.user, books: books, genre: genre, stripeKey: process.env.STRIPE_PUBLISHABLE_KEY }
            );
        })
        .catch(err => {
            if(err) throw err;
        })
    });
}

module.exports.checkBookOwnership = (req, res, next) => {
    let bookId = req.query.bookId;
    let userId = req.query.userId;
    console.log(bookId, userId);
    db.User.findOne({ 
        where: { id: userId }, include: [{ model: db.UserBookList, include: [{ model: db.Book, where: { id: bookId } }], require: true }] 
    })
    .then(user => {
        let owned = false;
        if(user.UserBookList)
            owned = true;
        res.send(JSON.stringify(owned));
    })
    .catch(err => { if(err) throw err; });
}

module.exports.purchaseBooks = (req, res, next) => {
    console.log(req.body);
    let total = 0;
    req.body.items.forEach(item => {
        total += item.price
    });
    stripe.charges.create({
        amount: Math.floor(total * 100),
        source: req.body.stripeTokenId,
        currency: 'aud'
    })
    .then(() => {
        createOrder(7, req.body.items, total, res);
    })
    .catch(err => {
        if(err)
            throw err;
    })
}