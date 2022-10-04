'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Stores', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      placeId: {
        type: Sequelize.STRING,
        unique: true
      },
      name: {
        type: Sequelize.STRING
      },
      descript: {
        type: Sequelize.TEXT
      },
      images: {
        type: Sequelize.JSON
      },
      formattedAddress: {
        type: Sequelize.STRING
      },
      geometry: {
        type: Sequelize.JSON
      },
      rating: {
        type: Sequelize.FLOAT
      },
      userRatingsTotal: {
        type: Sequelize.INTEGER
      },
      hours: {
        type: Sequelize.JSON
      },
      contacts: {
        type: Sequelize.JSON
      },
      types: {
        type: Sequelize.JSON
      },
      genres: {
        type: Sequelize.JSON
      },
      formats: {
        type: Sequelize.JSON
      },
      styles: {
        type: Sequelize.JSON
      },
      mainSells: {
        type: Sequelize.JSON
      },
      otherSells: {
        type: Sequelize.JSON
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stores');
  }
};