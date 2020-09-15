'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Books', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      isbn: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true
        }
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
          notEmpty: true
        }
      },
      price: {
        type: Sequelize.FLOAT,
        allowNull: false,
        validate: {
          isFloat: true
        }
      },
      link: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        validate: {
          isUrl: true
        }
      },
      vendorId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Vendors',
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
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Books');
  }
};