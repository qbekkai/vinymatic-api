'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('SocietesInVinyls', {
      LabelId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      roleSociete: {
        type: Sequelize.STRING
      },
      typeSociete: {
        type: Sequelize.STRING
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('SocietesInVinyls', {
      fields: ['LabelId', 'VinylId'],
      type: 'primary key',
      name: 'SocietesInVinyls_LabelId-VinylId_pkey'
    });

    await queryInterface.addConstraint('SocietesInVinyls', {
      fields: ['LabelId'],
      type: 'foreign key',
      name: 'SocietesInVinyls_LabelId_fkey',
      references: {
        table: 'Labels',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('SocietesInVinyls', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'SocietesInVinyls_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('SocietesInVinyls', 'SocietesInVinyls_LabelId_fkey');
    await queryInterface.removeConstraint('SocietesInVinyls', 'SocietesInVinyls_VinylId_fkey');

    await queryInterface.dropTable('SocietesInVinyls');
  }
};