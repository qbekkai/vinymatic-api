'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('Genres', [
      { id: 1, name: 'Blues' },
      { id: 2, name: 'Brass & Military' },
      { id: 3, name: 'Children\'s' },
      { id: 4, name: 'Classical' },
      { id: 5, name: 'Electronic' },
      { id: 6, name: 'Folk, World, & Country' },
      { id: 7, name: 'Funk / Soul' },
      { id: 8, name: 'Hip-Hop' },
      { id: 9, name: 'Jazz' },
      { id: 10, name: 'Latin' },
      { id: 11, name: 'Non-Music' },
      { id: 12, name: 'Pop' },
      { id: 13, name: 'Reggae' },
      { id: 14, name: 'Rock' },
      { id: 15, name: 'Stage & Screen' },
      { id: 16, name: 'Mixed' },
      { id: 17, name: 'Mixtape' },
      { id: 18, name: 'Numbered' },
      { id: 19, name: 'Partially Mixed' },
      { id: 20, name: 'Partially unofficial' },
      { id: 21, name: 'Picture Disc' },
      { id: 22, name: 'Promo' },
      { id: 23, name: 'Reissue' },
      { id: 24, name: 'Remastered' },
      { id: 25, name: 'Repress' },
      { id: 26, name: 'Sampler' },
      { id: 27, name: 'Single' },
      { id: 28, name: 'Special Edition' },
      { id: 29, name: 'Styrene' },
      { id: 30, name: 'Test Pressing' },
      { id: 31, name: 'Transcription' },
      { id: 32, name: 'Unofficial Release' },
      { id: 33, name: 'White Label' }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Genres', null, {});
  }
};
