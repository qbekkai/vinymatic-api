'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PlaylistLikes', {
      PlaylistId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('PlaylistLikes', {
      fields: ['PlaylistId', 'UserId'],
      type: 'primary key',
      name: 'PlaylistLikes_PlaylistId-UserId_pkey'
    });

    await queryInterface.addConstraint('PlaylistLikes', {
      fields: ['PlaylistId'],
      type: 'foreign key',
      name: 'PlaylistLikes_PlaylistId_fkey',
      references: {
        table: 'Playlists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('PlaylistLikes', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'PlaylistLikes_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('PlaylistLikes', 'PlaylistLikes_PlaylistId_fkey');
    await queryInterface.removeConstraint('PlaylistLikes', 'PlaylistLikes_UserId_fkey');

    await queryInterface.dropTable('PlaylistLikes');
  }
};