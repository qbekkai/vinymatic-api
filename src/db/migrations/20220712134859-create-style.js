'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Styles', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      GenreId: {
        type: Sequelize.INTEGER
      }
    });

    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('Styles', {
      fields: ['GenreId'],
      type: 'foreign key',
      name: 'Styles_GenreId_fkey',
      references: {
        table: 'Genres',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Styles', 'Styles_GenreId_fkey');

    await queryInterface.dropTable('Styles');
  }
};