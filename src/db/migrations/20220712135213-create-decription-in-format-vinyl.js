'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('DecriptionInFormatVinyls', {
      FormatDescriptionId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      FormatInVinylFormatId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      FormatInVinylVinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });

    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('DecriptionInFormatVinyls', {
      fields: ['FormatDescriptionId', 'FormatInVinylVinylId', 'FormatInVinylFormatId'],
      type: 'primary key',
      name: 'DecriptionInFormatVinyls_FormatDescripId-VinylIdFormatId_pkey'
    });

    await queryInterface.addConstraint('DecriptionInFormatVinyls', {
      fields: ['FormatDescriptionId', 'FormatInVinylVinylId', 'FormatInVinylFormatId'],
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
      fields: ['FormatInVinylVinylId', 'FormatInVinylFormatId'],
      type: 'foreign key',
      name: 'DecriptionInFormatVinyls_FormatInVinylVinylIdFormatId_fkey',
      references: {
        table: 'FormatInVinyls',
        fields: ['VinylId', 'FormatId']
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('DecriptionInFormatVinyls', 'DecriptionInFormatVinyls_FormatDescriptionId_fkey');
    await queryInterface.removeConstraint('DecriptionInFormatVinyls', 'DecriptionInFormatVinyls_FormatInVinylVinylIdFormatId_fkey');

    await queryInterface.dropTable('DecriptionInFormatVinyls');
  }
};