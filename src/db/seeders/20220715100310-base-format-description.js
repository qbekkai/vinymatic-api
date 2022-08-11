'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('FormatDescriptions', [
      { id: 1, name: 'Advance' },
      { id: 2, name: 'Album' },
      { id: 3, name: 'Card Backed' },
      { id: 4, name: 'Club Edition' },
      { id: 5, name: 'Compilation' },
      { id: 6, name: 'Deluxe Edition' },
      { id: 7, name: 'Enhanced' },
      { id: 8, name: 'EP' },
      { id: 9, name: 'Etched' },
      { id: 10, name: 'Gatefold' },
      { id: 11, name: 'Jukebox' },
      { id: 12, name: 'Limited Edition' },
      { id: 13, name: 'Maxi-Single' },
      { id: 14, name: 'Mini-Album' },
      { id: 15, name: 'Mispress' },
      { id: 16, name: 'Misprint' },
      { id: 17, name: 'Mixed' },
      { id: 18, name: 'Mixtape' },
      { id: 19, name: 'Numbered' },
      { id: 20, name: 'Partially Mixed' },
      { id: 21, name: 'Partially unofficial' },
      { id: 22, name: 'Picture Disc' },
      { id: 23, name: 'Promo' },
      { id: 24, name: 'Reissue' },
      { id: 25, name: 'Remastered' },
      { id: 26, name: 'Repress' },
      { id: 27, name: 'Sampler' },
      { id: 28, name: 'Single' },
      { id: 29, name: 'Special Edition' },
      { id: 30, name: 'Styrene' },
      { id: 31, name: 'Test Pressing' },
      { id: 32, name: 'Transcription' },
      { id: 33, name: 'Unofficial Release' },
      { id: 34, name: 'White Label' }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('FormatDescriptions', null, {});
  }
};
