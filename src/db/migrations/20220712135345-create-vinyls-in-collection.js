'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VinylsInCollections', {
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      CollectionId: {
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
    await queryInterface.addConstraint('VinylsInCollections', {
      fields: ['VinylId', 'CollectionId'],
      type: 'primary key',
      name: 'VinylsInCollections_VinylId-CollectionId_pkey'
    });

    await queryInterface.addConstraint('VinylsInCollections', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'VinylsInCollections_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('VinylsInCollections', {
      fields: ['CollectionId'],
      type: 'foreign key',
      name: 'VinylsInCollections_CollectionId_fkey',
      references: {
        table: 'Collections',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('VinylsInCollections', 'VinylsInCollections_VinylId_fkey');
    await queryInterface.removeConstraint('VinylsInCollections', 'VinylsInCollections_CollectionId_fkey');

    await queryInterface.dropTable('VinylsInCollections');
  }
};