'use strict';
const {
  Model
} = require('sequelize');
const userbooklistbook = require('./userbooklistbook');
module.exports = (sequelize, DataTypes) => {
  class UserBookList extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      UserBookList.belongsTo(models.User);
      UserBookList.belongsToMany(models.Book, { through: models.UserBookListBook });
    }
  };
  UserBookList.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    qty: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    modelName: 'UserBookList',
  });
  return UserBookList;
};