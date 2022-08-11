'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('UserTransporters', {
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      TransporterId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      freeCondition: {
        type: Sequelize.FLOAT
      },
      continents: {
        type: Sequelize.JSONB
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('UserTransporters', {
      fields: ['UserId', 'TransporterId'],
      type: 'primary key',
      name: 'UserTransporters_TransporterId-UserId_pkey'
    });

    await queryInterface.addConstraint('UserTransporters', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'UserTransporters_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('UserTransporters', {
      fields: ['TransporterId'],
      type: 'foreign key',
      name: 'UserTransporters_TransporterId_fkey',
      references: {
        table: 'Transporters',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('UserTransporters', 'UserTransporters_UserId_fkey');
    await queryInterface.removeConstraint('UserTransporters', 'UserTransporters_TransporterId_fkey');

    await queryInterface.dropTable('UserTransporters');
  }
};