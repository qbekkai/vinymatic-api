'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('AudiosInPlaylists', {
      AudioId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      PlaylistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      position: {
        type: Sequelize.INTEGER
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('AudiosInPlaylists', {
      fields: ['AudioId', 'PlaylistId'],
      type: 'primary key',
      name: 'AudiosInPlaylists_AudioId-PlaylistId_pkey'
    });

    await queryInterface.addConstraint('AudiosInPlaylists', {
      fields: ['AudioId'],
      type: 'foreign key',
      name: 'AudiosInPlaylists_AudioId_fkey',
      references: {
        table: 'Audios',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('AudiosInPlaylists', {
      fields: ['PlaylistId'],
      type: 'foreign key',
      name: 'AudiosInPlaylists_PlaylistId_fkey',
      references: {
        table: 'Playlists',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('AudiosInPlaylists', 'AudiosInPlaylists_AudioId_fkey');
    await queryInterface.removeConstraint('AudiosInPlaylists', 'AudiosInPlaylists_PlaylistId_fkey');

    await queryInterface.dropTable('AudiosInPlaylists');
  }
};