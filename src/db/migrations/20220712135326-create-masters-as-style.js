'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('MastersAsStyles', {
      MasterId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      StyleId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('MastersAsStyles', {
      fields: ['MasterId', 'StyleId'],
      type: 'primary key',
      name: 'MastersAsStyles_MasterId-StyleId_pkey'
    });

    await queryInterface.addConstraint('MastersAsStyles', {
      fields: ['MasterId'],
      type: 'foreign key',
      name: 'MastersAsStyles_MasterId_fkey',
      references: {
        table: 'Masters',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('MastersAsStyles', {
      fields: ['StyleId'],
      type: 'foreign key',
      name: 'MastersAsStyles_StyleId_fkey',
      references: {
        table: 'Styles',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('MastersAsStyles', 'MastersAsStyles_MasterId_fkey');
    await queryInterface.removeConstraint('MastersAsStyles', 'MastersAsStyles_StyleId_fkey');

    await queryInterface.dropTable('MastersAsStyles');
  }
};