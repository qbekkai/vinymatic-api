'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('LabelFollowers', {
      LabelId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });



    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('LabelFollowers', {
      fields: ['LabelId', 'UserId'],
      type: 'primary key',
      name: 'LabelFollowers_LabelId-UserId_pkey'
    });

    await queryInterface.addConstraint('LabelFollowers', {
      fields: ['LabelId'],
      type: 'foreign key',
      name: 'LabelFollowers_LabelId_fkey',
      references: {
        table: 'Labels',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('LabelFollowers', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'LabelFollowers_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('LabelFollowers', 'LabelFollowers_LabelId_fkey');
    await queryInterface.removeConstraint('LabelFollowers', 'LabelFollowers_UserId_fkey');

    await queryInterface.dropTable('LabelFollowers');
  }
};