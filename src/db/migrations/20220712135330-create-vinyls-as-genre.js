'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VinylsAsGenres', {
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      GenreId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('VinylsAsGenres', {
      fields: ['VinylId', 'GenreId'],
      type: 'primary key',
      name: 'VinylsAsGenres_VinylId-GenreId_pkey'
    });

    await queryInterface.addConstraint('VinylsAsGenres', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'VinylsAsGenres_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('VinylsAsGenres', {
      fields: ['GenreId'],
      type: 'foreign key',
      name: 'VinylsAsGenres_GenreId_fkey',
      references: {
        table: 'Genres',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('VinylsAsGenres', 'VinylsAsGenres_VinylId_fkey');
    await queryInterface.removeConstraint('VinylsAsGenres', 'VinylsAsGenres_GenreId_fkey');

    await queryInterface.dropTable('VinylsAsGenres');
  }
};