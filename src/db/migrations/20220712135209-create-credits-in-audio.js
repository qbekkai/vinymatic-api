'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('CreditsInAudios', {
      ArtistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      AudioId: {
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
    await queryInterface.addConstraint('CreditsInAudios', {
      fields: ['ArtistId', 'AudioId'],
      type: 'primary key',
      name: 'CreditsInAudios_ArtistId-AudioId_pkey'
    });

    await queryInterface.addConstraint('CreditsInAudios', {
      fields: ['ArtistId'],
      type: 'foreign key',
      name: 'CreditsInAudios_ArtistId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('CreditsInAudios', {
      fields: ['AudioId'],
      type: 'foreign key',
      name: 'CreditsInAudios_AudioId_fkey',
      references: {
        table: 'Audios',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('CreditsInAudios', 'CreditsInAudios_ArtistId_fkey');
    await queryInterface.removeConstraint('CreditsInAudios', 'CreditsInAudios_AudioId_fkey');

    await queryInterface.dropTable('CreditsInAudios');
  }
};