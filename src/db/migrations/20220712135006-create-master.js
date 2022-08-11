'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Masters', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        unique: true
      },
      idMaster: {
        type: Sequelize.INTEGER,
        unique: true
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      releaseDate: {
        type: Sequelize.DATE
      },
      masterUrl: {
        type: Sequelize.STRING
      },
      resourceUrl: {
        type: Sequelize.STRING
      },
      images: {
        type: Sequelize.JSONB
      },
      thumbnail: {
        type: Sequelize.STRING
      },
      tracklist: {
        type: Sequelize.JSONB
      },
      verify: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
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
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Masters');
  }
};