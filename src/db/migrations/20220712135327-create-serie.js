'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Series', {
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
    await queryInterface.addConstraint('Series', {
      fields: ['LabelId', 'VinylId'],
      type: 'primary key',
      name: 'Series_LabelId-VinylId_pkey'
    });

    await queryInterface.addConstraint('Series', {
      fields: ['LabelId'],
      type: 'foreign key',
      name: 'Series_LabelId_fkey',
      references: {
        table: 'Labels',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Series', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'Series_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Series', 'Series_LabelId_fkey');
    await queryInterface.removeConstraint('Series', 'Series_VinylId_fkey');

    await queryInterface.dropTable('Series');
  }
};