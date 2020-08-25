'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transaction extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Transaction.belongsTo(models.Coupon);
      Transaction.hasOne(models.Order);
    }
  };
  Transaction.init({
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: Sequelize.INTEGER
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    method: {
      type: Sequelize.STRING,
      allowNull: false
    },
    couponId: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'Coupons',
        key: 'id'
      }
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE
    }
  }, {
    sequelize,
    modelName: 'Transaction',
  });
  return Transaction;
};