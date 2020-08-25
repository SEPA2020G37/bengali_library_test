'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserBookListBook extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  };
  UserBookListBook.init({
    bookId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false,
      references: {
        model: 'Books',
        key: 'id'
      }
    },
    userBookListId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false,
      references: {
        model: 'UserBookLists',
        key: 'id'
      }
    },
    currentPage: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        isNumeric: true,
        isInt: true
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
    modelName: 'UserBookListBook',
  });
  return UserBookListBook;
};