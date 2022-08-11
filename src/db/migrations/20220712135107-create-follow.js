'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Follows', {
      FollowerId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      FollowingId: {
        type: Sequelize.INTEGER,
        allowNull: false
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
    await queryInterface.addConstraint('Follows', {
      fields: ['FollowerId', 'FollowingId'],
      type: 'primary key',
      name: 'Follows_FollowerId-FollowingId_pkey'
    });

    await queryInterface.addConstraint('Follows', {
      fields: ['FollowerId'],
      type: 'foreign key',
      name: 'Follows_FollowerId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
    await queryInterface.addConstraint('Follows', {
      fields: ['FollowingId'],
      type: 'foreign key',
      name: 'Follows_FollowingId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Follows', 'Follows_FollowerId_fkey');
    await queryInterface.removeConstraint('Follows', 'Follows_FollowingId_fkey');

    await queryInterface.dropTable('Follows');
  }
};