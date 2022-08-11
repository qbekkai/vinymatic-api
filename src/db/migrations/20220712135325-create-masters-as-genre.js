'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MastersAsGenres', {
      MasterId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      GenreId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('MastersAsGenres', {
      fields: ['MasterId', 'GenreId'],
      type: 'primary key',
      name: 'MastersAsGenres_MasterId-GenreId_pkey'
    });

    await queryInterface.addConstraint('MastersAsGenres', {
      fields: ['MasterId'],
      type: 'foreign key',
      name: 'MastersAsGenres_MasterId_fkey',
      references: {
        table: 'Masters',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('MastersAsGenres', {
      fields: ['GenreId'],
      type: 'foreign key',
      name: 'MastersAsGenres_GenreId_fkey',
      references: {
        table: 'Genres',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('MastersAsGenres', 'MastersAsGenres_MasterId_fkey');
    await queryInterface.removeConstraint('MastersAsGenres', 'MastersAsGenres_GenreId_fkey');

    await queryInterface.dropTable('MastersAsGenres');
  }
};