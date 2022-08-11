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
        type: Sequelize.JSONB
      },
      formattedAddress: {
        type: Sequelize.STRING
      },
      geometry: {
        type: Sequelize.JSONB
      },
      rating: {
        type: Sequelize.FLOAT
      },
      userRatingsTotal: {
        type: Sequelize.INTEGER
      },
      hours: {
        type: Sequelize.JSONB
      },
      contacts: {
        type: Sequelize.JSONB
      },
      types: {
        type: Sequelize.JSONB
      },
      genres: {
        type: Sequelize.JSONB
      },
      formats: {
        type: Sequelize.JSONB
      },
      styles: {
        type: Sequelize.JSONB
      },
      mainSells: {
        type: Sequelize.JSONB
      },
      otherSells: {
        type: Sequelize.JSONB
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Stores');
  }
};