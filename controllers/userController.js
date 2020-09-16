const fs = require("fs");
const path = require("path");
const async = require("async");
const aws = require("../utils/S3");
const db = require("../models/index");

module.exports.getDashboard = (req, res, next) => {
  db.Book.findAll({
    limit: 10,
    include: [{ model: db.Vendor, key: "id" }],
  })
    .then((books) => {
      db.Vendor.findAll()
        .then((vendors) => {
          res.render("user-dashboard", {
            title: "adminDB",
            books: books,
            vendors: vendors,
          });
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      throw err;
    });
};
