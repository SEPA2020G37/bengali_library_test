'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Coupon extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Coupon.hasMany(models.Transaction);
    }
  };
  Coupon.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.INTEGER
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlphanumeric: true
      }
    },
    discount: {
      type: DataTypes.FLOAT,
      allowNull: false,
      validate: {
        isFloat: true
      }
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isAlpha: true
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
    modelName: 'Coupon',
  });
  return Coupon;
};