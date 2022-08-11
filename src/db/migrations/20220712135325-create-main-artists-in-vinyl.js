'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MainArtistsInVinyls', {
      ArtistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('MainArtistsInVinyls', {
      fields: ['ArtistId', 'VinylId'],
      type: 'primary key',
      name: 'MainArtistsInVinyls_ArtistId-VinylId_pkey'
    });

    await queryInterface.addConstraint('MainArtistsInVinyls', {
      fields: ['ArtistId'],
      type: 'foreign key',
      name: 'MainArtistsInVinyls_ArtistId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('MainArtistsInVinyls', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'MainArtistsInVinyls_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('MainArtistsInVinyls', 'MainArtistsInVinyls_ArtistId_fkey');
    await queryInterface.removeConstraint('MainArtistsInVinyls', 'MainArtistsInVinyls_VinylId_fkey');

    await queryInterface.dropTable('MainArtistsInVinyls');
  }
};