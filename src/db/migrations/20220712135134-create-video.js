'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Videos', {
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
      image: {
        type: Sequelize.STRING
      },
      videoUrl: {
        type: Sequelize.STRING
      },
      ArtistId: {
        type: Sequelize.INTEGER
      },
      UserId: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        type: Sequelize.DATEONLY,
        defaultValue: new Date()
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('Videos', {
      fields: ['ArtistId'],
      type: 'foreign key',
      name: 'Videos_ArtistId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });
    await queryInterface.addConstraint('Videos', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'Videos_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Videos', 'Videos_ArtistId_fkey');
    await queryInterface.removeConstraint('Videos', 'Videos_UserId_fkey');

    await queryInterface.dropTable('Videos');
  }
};