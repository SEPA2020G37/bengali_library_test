const fs = require("fs");
const path = require("path");
const async = require("async");
const aws = require("../utils/S3");
const db = require("../models/index");
const { resolve } = require("path");

module.exports.getDashboard = (req, res, next) => {
  //here will get all the book that the user having

  console.log(req.user);
  getUserBookList(req.user.id).then((books)=>{
    getUserWishList(req.user.id).then((wishBooks)=>{
      res.render("user-dashboard", {
        title: "userDB",
        user: req.user,
        books: books,
        wishBooks: wishBooks,
      });      
    });
  });
};

module.exports.getBook = (req, res) => {
  let data = req.query.data;
  if(req.user){
    db.Book.count({
      where: {isbn: data},
      include: [{ model: db.UserBookList, where: { userId: req.user.id } }],
    })
    .then((bookCount)=>{
      var own;
      if(bookCount == 0){
        own = false;
      }else{
        own = true;
      }
      getBook(data).then(([vendor,book])=>{
        getRecommendBooks(req.user.id,book.isbn).then((books)=>{
          console.log(books);
          res.render("book", {
            title: "book",
            user: req.user,
            book: book,
            recommendBooks: books,
            vendor: vendor,
            own: own,
          });          
        })
      })
    }) 
  }else{
    getBook(data).then(([vendor,book])=>{
      db.Book.findAll({
        where: {
          vendorId: vendor.id,
          isbn: {
            [db.Sequelize.Op.ne]: book.isbn
          }
        }
      }).then((books)=>{
        res.render("book", {
          title: "book",
          user: req.user,
          book: book,
          recommendBooks: books,
          vendor: vendor,
          own: false,
        });  
      })
    })
  }
 
};

module.exports.pdfViewer = (req, res, next) => {
  // var userId = req.user.id;
  var userId = req.user.id;
  var isbn = req.query.isbn;
  getUserBookListsBook(userId, isbn).then((userBookListsBook) => {
    var src =
      "https://" + req.query.isbn + ".s3.amazonaws.com/" + req.query.isbn + "-";
    src += userBookListsBook.currentPage;
    src += ".pdf#toolbar=0&navpanes=0&statusbar=0";

    res.render("pdf-viewer", {
      title: "pdf-viewer",
      user: req.user,
      isbn: isbn,
      page: userBookListsBook.currentPage,
      link: src,
    });
  });
};

module.exports.booklist = (req, res, next) => {
  getUserBookList(req.user.id).then((books)=>{
    res.render("mybooks", {
      title: "my book list",
      user: req.user,
      books: books,
    });      
  });
};

module.exports.wishList = (req, res, next) => {
  getUserWishList(req.user.id).then((wishBooks)=>{
    res.render("myWishList", {
      title: "my book list",
      user: req.user,
      books: wishBooks,
    });      
  });
};

module.exports.next = (req, res) => {
  console.log(req.query);
  getUserBookListsBook(req.user.id, req.query.isbn)
    .then((data) => {
      data.currentPage++;
      return data;
    })
    .then((data) => {
      data.save();
      let pageNumber = data.currentPage;

      var src =
        "https://" +
        req.query.isbn +
        ".s3.amazonaws.com/" +
        req.query.isbn +
        "-";
      src += pageNumber;
      src += ".pdf#toolbar=0&navpanes=0&statusbar=0";

      res.send(JSON.stringify({ link: src, pageNumber: pageNumber }));
    });
};

module.exports.prev = (req, res) => {
  getUserBookListsBook(req.user.id, req.query.isbn)
    .then((data) => {
      data.currentPage--;
      return data;
    })
    .then((data) => {
      data.save();
      console.log(data.currentPage);
      let pageNumber = data.currentPage;

      var src =
        "https://" +
        req.query.isbn +
        ".s3.amazonaws.com/" +
        req.query.isbn +
        "-";
      src += pageNumber;
      src += ".pdf#toolbar=0&navpanes=0&statusbar=0";

      res.send(JSON.stringify({ link: src, pageNumber: pageNumber }));
    });
};

function getRecommendBooks(userId,isbn){
  return new Promise((resolve,reject)=>{
    db.Book.findOne({
      where: {isbn:isbn},
    })
    .then((book)=>{
      db.Book.findAll({
        where: {
          isbn: {
            [db.Sequelize.Op.ne]: isbn
          }
        },
      })
      .then((books)=>{
        if(books)resolve(books);
      })
      .catch((err)=>{
        if(err) reject(err);
      })
    })
  })
};

function getBook(isbn){
  return new Promise((resolve, reject)=>{
      db.Book.findOne({
    where: { isbn: isbn },
  })
    .then((book) => {
      db.Vendor.findOne({
        where: { id: book.vendorId },
      })
        .then((vendor) => {      
          if(vendor) resolve([vendor,book]);
        })
        .catch((err) => {
          if(err) reject(err);
        });
    })
    .catch((err) => {
      if(err) reject(err);
    });
  })
};

function getUserBookList(userId){
  return new Promise((resolve, reject)=>{
    db.Book.findAll({
      include: [{ model: db.UserBookList, where: { userId: userId } }],
    })
      .then((books) => {
        if(books) resolve(books);
      })
      .catch((err) => {
        if(err) reject(err);
      });
  })
};

function getUserWishList(userId){
  return new Promise((resolve, reject)=>{
    db.Book.findAll({
      include: [{ model: db.UserWishList, where: { userId: userId } }],
    })
      .then((wishBooks) => {
        if(wishBooks) resolve(wishBooks);
      })
      .catch((err) => {
        if(err) reject(err);
      });
  })
};

function getUserBookListsBook(userId, isbn) {
  return new Promise((resolve, reject) => {
    db.Book.findOne({
      where: { isbn: isbn },
      include: [{ model: db.UserBookList, where: { userId: userId } }],
    }).then((book) => {
      console.log(book);
      db.UserBookListBook.findOne({
        where: { bookId: book.id, UserBookListId: book.UserBookLists[0].id },
      })
        .then((UserBookListBook) => {
          if (UserBookListBook) resolve(UserBookListBook);
        })
        .catch((err) => {
          if (err) reject(err);
        });
    });
  });
};

function getBookIdThatUserHad(userId) {
  return new Promise((resolve, reject) => {
    db.UserBookList.findOne({
      attributes: ['id'],
      where: { userId: userId },
    }).then((userBookListId) => {
      db.UserBookListBook.findAll({
        attributes: ['bookId'],
        where: { UserBookListId: userBookListId },
      })
        .then((UserBookListBook) => {
          console.log(UserBookListBook);
          if (UserBookListBook) resolve(UserBookListBook);
        })
        .catch((err) => {
          if (err) reject(err);
        });
    });
  });
};
