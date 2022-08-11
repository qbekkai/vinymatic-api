'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VinylLikes', {
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('VinylLikes', {
      fields: ['VinylId', 'UserId'],
      type: 'primary key',
      name: 'VinylLikes_VinylId-UserId_pkey'
    });

    await queryInterface.addConstraint('VinylLikes', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'VinylLikes_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('VinylLikes', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'VinylLikes_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('VinylLikes', 'VinylLikes_VinylId_fkey');
    await queryInterface.removeConstraint('VinylLikes', 'VinylLikes_UserId_fkey');

    await queryInterface.dropTable('VinylLikes');
  }
};