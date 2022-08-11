'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CreditsInMasters', {
      ArtistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      MasterId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      roleCredit: {
        type: Sequelize.STRING
      },
      typeCredit: {
        type: Sequelize.STRING
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('CreditsInMasters', {
      fields: ['ArtistId', 'MasterId'],
      type: 'primary key',
      name: 'CreditsInMasters_ArtistId-MasterId_pkey'
    });

    await queryInterface.addConstraint('CreditsInMasters', {
      fields: ['ArtistId'],
      type: 'foreign key',
      name: 'CreditsInMasters_ArtistId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('CreditsInMasters', {
      fields: ['MasterId'],
      type: 'foreign key',
      name: 'CreditsInMasters_MasterId_fkey',
      references: {
        table: 'Masters',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CreditsInMasters', 'CreditsInMasters_ArtistId_fkey');
    await queryInterface.removeConstraint('CreditsInMasters', 'CreditsInMasters_MasterId_fkey');

    await queryInterface.dropTable('CreditsInMasters');
  }
};