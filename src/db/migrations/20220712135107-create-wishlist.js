'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Wishlists', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      imageUrl: {
        type: Sequelize.STRING
      },
      UserId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATEONLY,
        defaultValue: new Date()
      },
      updatedAt: {
        type: Sequelize.DATEONLY,
        defaultValue: new Date()
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('Wishlists', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'Wishlists_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Wishlists', 'Wishlists_UserId_fkey');

    await queryInterface.dropTable('Wishlists');
  }
};