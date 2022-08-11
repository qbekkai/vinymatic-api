'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('VideoLikes', {
      VideoId: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      UserId: {
        type: Sequelize.INTEGER,
        allowNull: false
      }
    });


    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('VideoLikes', {
      fields: ['VideoId', 'UserId'],
      type: 'primary key',
      name: 'VideoLikes_VideoId-UserId_pkey'
    });

    await queryInterface.addConstraint('VideoLikes', {
      fields: ['VideoId'],
      type: 'foreign key',
      name: 'VideoLikes_VideoId_fkey',
      references: {
        table: 'Videos',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('VideoLikes', {
      fields: ['UserId'],
      type: 'foreign key',
      name: 'VideoLikes_UserId_fkey',
      references: {
        table: 'Users',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('VideoLikes', 'VideoLikes_VideoId_fkey');
    await queryInterface.removeConstraint('VideoLikes', 'VideoLikes_UserId_fkey');

    await queryInterface.dropTable('VideoLikes');
  }
};