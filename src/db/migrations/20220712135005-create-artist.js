'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Artists', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      idArtist: {
        type: Sequelize.INTEGER,
        unique: true
      },
      name: {
        type: Sequelize.STRING
      },
      fullName: {
        type: Sequelize.STRING
      },
      aliasNames: {
        type: Sequelize.JSON
      },
      variantNames: {
        type: Sequelize.JSON
      },
      description: {
        type: Sequelize.TEXT
      },
      inGroups: {
        type: Sequelize.JSON
      },
      images: {
        type: Sequelize.JSON
      },
      thumbnail: {
        type: Sequelize.STRING
      },
      artistUrl: {
        type: Sequelize.STRING
      },
      resourceUrl: {
        type: Sequelize.STRING
      },
      verify: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Artists');
  }
};