'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Sellings', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      itemWeight: {
        type: Sequelize.FLOAT
      },
      price: {
        type: Sequelize.FLOAT
      },
      devise: {
        type: Sequelize.STRING
      },
      quantity: {
        type: Sequelize.INTEGER
      },
      additionalImages: {
        type: Sequelize.JSONB
      },
      diskCondition: {
        type: Sequelize.STRING
      },
      coverCondition: {
        type: Sequelize.STRING
      },
      isSelled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      UserId: {
        type: Sequelize.INTEGER
      },
      VinylId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATEONLY,
        defaultValue: new Date()
      },
      updatedAt: {
        type: Sequelize.DATEONLY,
        defaultValue: new Date()
      }
    });

    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('Sellings', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'Sellings_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Sellings', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'Sellings_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Sellings', 'Sellings_UserId_fkey');
    await queryInterface.removeConstraint('Sellings', 'Sellings_VinylId_fkey');

    await queryInterface.dropTable('Sellings');
  }
};