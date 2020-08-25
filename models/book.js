'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Book extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Book.belongsTo(models.Vendor);
      Book.belongsToMany(models.Genre, { through: models.BookGenre });
      Book.belongsToMany(models.Order, { through: models.BookOrder });
      Book.belongsToMany(models.UserBookList, { through: models.UserBookListBook });
      Book.belongsToMany(models.UserWishList, { through: models.UserWishListBook });
    }
  };
  Book.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    isbn: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true
      }
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true
      }
    },
    price: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true
      }
    },
    link: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isUrl: true
      }
    },
    vendorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Vendors',
        key: 'id'
      }
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE
    }
  }, {
    sequelize,
    modelName: 'Book',
  });
  return Book;
};