module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('FormatVoices', [
      { id: 1, name: 'Stereo' },
      { id: 2, name: 'Mono' },
      { id: 3, name: 'Ambisonic' },
      { id: 4, name: 'Quadraphonic' },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FormatVoices', null, {});
  }
};