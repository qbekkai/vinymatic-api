'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ArtistFollowers', {
      ArtistId: {
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
    await queryInterface.addConstraint('ArtistFollowers', {
      fields: ['ArtistId', 'UserId'],
      type: 'primary key',
      name: 'ArtistFollowers_ArtistId-UserId_pkey'
    });

    await queryInterface.addConstraint('ArtistFollowers', {
      fields: ['ArtistId'],
      type: 'foreign key',
      name: 'ArtistFollowers_ArtistId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('ArtistFollowers', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'ArtistFollowers_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('ArtistFollowers', 'ArtistFollowers_ArtistId_fkey');
    await queryInterface.removeConstraint('ArtistFollowers', 'ArtistFollowers_UserId_fkey');

    await queryInterface.dropTable('ArtistFollowers');
  }
};