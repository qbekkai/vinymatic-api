'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('FormatInVinyls', {
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      FormatId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      nbFormat: {
        type: Sequelize.INTEGER
      },
      text: {
        type: Sequelize.TEXT
      },
      FormatSideId: {
        type: Sequelize.INTEGER
      },
      FormatSizeId: {
        type: Sequelize.INTEGER
      },
      FormatSpeedId: {
        type: Sequelize.INTEGER
      },
      FormatVoiceId: {
        type: Sequelize.INTEGER
      }
    });

    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['VinylId', 'FormatId'],
      type: 'primary key',
      name: 'FormatInVinyls_VinylId-FormatId_pkey'
    });

    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['VinylId', 'FormatId'],
      type: 'unique',
      name: 'FormatInVinyls_VinylId-FormatId_unique'
    });

    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'FormatInVinyls_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['FormatId'],
      type: 'foreign key',
      name: 'FormatInVinyls_FormatId_fkey',
      references: {
        table: 'Formats',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['FormatSideId'],
      type: 'foreign key',
      name: 'FormatInVinyls_FormatSideId_fkey',
      references: {
        table: 'FormatSides',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['FormatSizeId'],
      type: 'foreign key',
      name: 'FormatInVinyls_FormatSizeId_fkey',
      references: {
        table: 'FormatSizes',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['FormatSpeedId'],
      type: 'foreign key',
      name: 'FormatInVinyls_FormatSpeedId_fkey',
      references: {
        table: 'FormatSpeeds',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('FormatInVinyls', {
      fields: ['FormatVoiceId'],
      type: 'foreign key',
      name: 'FormatInVinyls_FormatVoiceId_fkey',
      references: {
        table: 'FormatVoices',
        field: 'id'
      }
    });


  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('FormatInVinyls', 'FormatInVinyls_VinylId_fkey');
    await queryInterface.removeConstraint('FormatInVinyls', 'FormatInVinyls_FormatId_fkey');
    await queryInterface.removeConstraint('FormatInVinyls', 'FormatInVinyls_FormatSideId_fkey');
    await queryInterface.removeConstraint('FormatInVinyls', 'FormatInVinyls_FormatSizeId_fkey');
    await queryInterface.removeConstraint('FormatInVinyls', 'FormatInVinyls_FormatSpeedId_fkey');
    await queryInterface.removeConstraint('FormatInVinyls', 'FormatInVinyls_FormatVoiceId_fkey');

    await queryInterface.dropTable('FormatInVinyls');
  }
};