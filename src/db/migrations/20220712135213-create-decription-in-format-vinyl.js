'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DecriptionInFormatVinyls', {
      FormatDescriptionId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      FormatInVinylsFormatId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      FormatInVinylsVinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });

    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('DecriptionInFormatVinyls', {
      fields: ['FormatDescriptionId', 'FormatInVinylsVinylId', 'FormatInVinylsFormatId'],
      type: 'primary key',
      name: 'DecriptionInFormatVinyls_FormatDescripId-VinylIdFormatId_pkey'
    });

    await queryInterface.addConstraint('DecriptionInFormatVinyls', {
      fields: ['FormatDescriptionId', 'FormatInVinylsVinylId', 'FormatInVinylsFormatId'],
      type: 'unique',
      name: 'DecriptionInFormatVinyls_FormatDescripId-VinylIdFormatId_unique'
    });

    await queryInterface.addConstraint('DecriptionInFormatVinyls', {
      fields: ['FormatDescriptionId'],
      type: 'foreign key',
      name: 'DecriptionInFormatVinyls_FormatDescriptionId_fkey',
      references: {
        table: 'FormatDescriptions',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('DecriptionInFormatVinyls', {
      fields: ['FormatInVinylsVinylId', 'FormatInVinylsFormatId'],
      type: 'foreign key',
      name: 'DecriptionInFormatVinyls_FormatInVinylsVinylIdFormatId_fkey',
      references: {
        table: 'FormatInVinyls',
        fields: ['VinylId', 'FormatId']
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('DecriptionInFormatVinyls', 'DecriptionInFormatVinyls_FormatDescriptionId_fkey');
    await queryInterface.removeConstraint('DecriptionInFormatVinyls', 'DecriptionInFormatVinyls_FormatInVinylsVinylIdFormatId_fkey');

    await queryInterface.dropTable('DecriptionInFormatVinyls');
  }
};