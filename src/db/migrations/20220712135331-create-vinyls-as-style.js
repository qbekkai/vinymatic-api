'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VinylsAsStyles', {
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      StyleId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('VinylsAsStyles', {
      fields: ['VinylId', 'StyleId'],
      type: 'primary key',
      name: 'VinylsAsStyles_VinylId-StyleId_pkey'
    });

    await queryInterface.addConstraint('VinylsAsStyles', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'VinylsAsStyles_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('VinylsAsStyles', {
      fields: ['StyleId'],
      type: 'foreign key',
      name: 'VinylsAsStyles_StyleId_fkey',
      references: {
        table: 'Styles',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('VinylsAsStyles', 'VinylsAsStyles_VinylId_fkey');
    await queryInterface.removeConstraint('VinylsAsStyles', 'VinylsAsStyles_StyleId_fkey');

    await queryInterface.dropTable('VinylsAsStyles');
  }
};