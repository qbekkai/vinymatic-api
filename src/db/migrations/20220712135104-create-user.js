'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      username: {
        type: Sequelize.STRING,
        unique: true
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      phoneNumber: {
        type: Sequelize.STRING,
        unique: true
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      showName: {
        type: Sequelize.STRING
      },
      birthDate: {
        type: Sequelize.DATE
      },
      role: {
        type: Sequelize.STRING
      },
      profilImage: {
        type: Sequelize.STRING
      },
      note: {
        type: Sequelize.INTEGER
      },
      localisation: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      coverImage: {
        type: Sequelize.TEXT
      },
      password: {
        type: Sequelize.STRING
      },
      emailToken: {
        type: Sequelize.STRING
      },
      verifiedEmail: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      verifiedPhone: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      userAppleId: {
        type: Sequelize.STRING,
        unique: true
      },
      userGoogleId: {
        type: Sequelize.STRING,
        unique: true
      },
      preferences: {
        type: Sequelize.JSON,
        defaultValue: {}
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};