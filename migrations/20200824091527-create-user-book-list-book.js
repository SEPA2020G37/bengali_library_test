'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('UserBookListBooks', {
      bookId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: false,
        references: {
          model: 'Books',
          key: 'id'
        }
      },
      userBookListId: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        allowNull: false,
        autoIncrement: false,
        references: {
          model: 'UserBookLists',
          key: 'id'
        }
      },
      currentPage: {
        type: Sequelize.INTEGER,
        allowNull: true,
        validate: {
          isNumeric: true,
          isInt: true
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
    await queryInterface.dropTable('UserBookListBooks');
  }
};