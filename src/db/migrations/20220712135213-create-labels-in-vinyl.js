'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LabelsInVinyls', {
      LabelId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      VinylId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      catno: {
        type: Sequelize.STRING
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('LabelsInVinyls', {
      fields: ['LabelId', 'VinylId'],
      type: 'primary key',
      name: 'LabelsInVinyls_LabelId-VinylId_pkey'
    });

    await queryInterface.addConstraint('LabelsInVinyls', {
      fields: ['LabelId'],
      type: 'foreign key',
      name: 'LabelsInVinyls_LabelId_fkey',
      references: {
        table: 'Labels',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('LabelsInVinyls', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'LabelsInVinyls_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('LabelsInVinyls', 'LabelsInVinyls_LabelId_fkey');
    await queryInterface.removeConstraint('LabelsInVinyls', 'LabelsInVinyls_VinylId_fkey');

    await queryInterface.dropTable('LabelsInVinyls');
  }
};