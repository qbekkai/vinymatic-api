'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VinylsInWishlists', {
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      WishlistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      coverCondition: {
        type: Sequelize.STRING
      },
      diskCondition: {
        type: Sequelize.STRING
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('VinylsInWishlists', {
      fields: ['VinylId', 'WishlistId'],
      type: 'primary key',
      name: 'VinylsInWishlists_VinylId-WishlistId_pkey'
    });

    await queryInterface.addConstraint('VinylsInWishlists', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'VinylsInWishlists_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('VinylsInWishlists', {
      fields: ['WishlistId'],
      type: 'foreign key',
      name: 'VinylsInWishlists_WishlistId_fkey',
      references: {
        table: 'Wishlists',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('VinylsInWishlists', 'VinylsInWishlists_VinylId_fkey');
    await queryInterface.removeConstraint('VinylsInWishlists', 'VinylsInWishlists_WishlistId_fkey');

    await queryInterface.dropTable('VinylsInWishlists');
  }
};