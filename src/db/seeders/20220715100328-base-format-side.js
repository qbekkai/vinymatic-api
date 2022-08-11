'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('FormatSides', [
      { id: 1, name: 'Single Sided' }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FormatSides', null, {});
  }
};
