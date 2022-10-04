'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Identifiers', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      type: {
        type: Sequelize.STRING
      },
      value: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      VinylId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('Identifiers', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'Identifiers_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Identifiers', 'Identifiers_VinylId_fkey');

    await queryInterface.dropTable('Identifiers');
  }
};