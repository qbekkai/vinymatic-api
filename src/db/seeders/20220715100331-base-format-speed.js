module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('FormatSpeeds', [
      { id: 1, name: '33 ⅓ RPM' },
      { id: 2, name: '45 RPM' },
      { id: 3, name: '78 RPM' },
      { id: 4, name: '80 RPM' },
      { id: 5, name: '16 ⅔ RPM' },
      { id: 6, name: '8 ⅓ RPM' }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FormatSpeeds', null, {});
  }
};