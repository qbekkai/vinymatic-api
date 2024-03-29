'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ModifEntityRequests', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      entity: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      idEntity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      body: {
        type: Sequelize.JSON,
        allowNull: false,
      },
      query: {
        type: Sequelize.JSON
      },
      published: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      UserId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('ModifEntityRequests', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'ModifEntityRequests_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('ModifEntityRequests', 'ModifEntityRequests_UserId_fkey');

    await queryInterface.dropTable('ModifEntityRequests');
  }
};