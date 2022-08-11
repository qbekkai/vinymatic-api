'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MainArtistsInMasters', {
      ArtistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      MasterId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('MainArtistsInMasters', {
      fields: ['ArtistId', 'MasterId'],
      type: 'primary key',
      name: 'MainArtistsInMasters_ArtistId-MasterId_pkey'
    });

    await queryInterface.addConstraint('MainArtistsInMasters', {
      fields: ['ArtistId'],
      type: 'foreign key',
      name: 'MainArtistsInMasters_ArtistId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('MainArtistsInMasters', {
      fields: ['MasterId'],
      type: 'foreign key',
      name: 'MainArtistsInMasters_MasterId_fkey',
      references: {
        table: 'Masters',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('MainArtistsInMasters', 'MainArtistsInMasters_ArtistId_fkey');
    await queryInterface.removeConstraint('MainArtistsInMasters', 'MainArtistsInMasters_MasterId_fkey');

    await queryInterface.dropTable('MainArtistsInMasters');
  }
};