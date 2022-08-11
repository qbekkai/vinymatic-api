'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('FormatSizes', [
      { id: 1, name: '1"' },
      { id: 2, name: '2"' },
      { id: 3, name: '3"' },
      { id: 4, name: '3½"' },
      { id: 5, name: '4"' },
      { id: 6, name: '5"' },
      { id: 7, name: '5½"' },
      { id: 8, name: '6"' },
      { id: 9, name: '6½"' },
      { id: 10, name: '7"' },
      { id: 11, name: '8"' },
      { id: 12, name: '9"' },
      { id: 13, name: '10"' },
      { id: 14, name: '11"' },
      { id: 15, name: '12"' },
      { id: 16, name: '16"' },
      { id: 17, name: 'LP' }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FormatSizes', null, {});
  }
};
