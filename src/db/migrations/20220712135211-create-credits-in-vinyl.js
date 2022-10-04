'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CreditsInVinyls', {
      ArtistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      roleCredit: {
        type: Sequelize.JSON
      },
      typeCredit: {
        type: Sequelize.STRING
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('CreditsInVinyls', {
      fields: ['ArtistId', 'VinylId'],
      type: 'primary key',
      name: 'CreditsInVinyls_ArtistId-VinylId_pkey'
    });

    await queryInterface.addConstraint('CreditsInVinyls', {
      fields: ['ArtistId'],
      type: 'foreign key',
      name: 'CreditsInVinyls_ArtistId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('CreditsInVinyls', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'CreditsInVinyls_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CreditsInVinyls', 'CreditsInVinyls_ArtistId_fkey');
    await queryInterface.removeConstraint('CreditsInVinyls', 'CreditsInVinyls_VinylId_fkey');

    await queryInterface.dropTable('CreditsInVinyls');
  }
};