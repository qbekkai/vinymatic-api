'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Audios', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      title: {
        type: Sequelize.STRING
      },
      mainTitle: {
        type: Sequelize.STRING
      },
      subTitle: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      image: {
        type: Sequelize.STRING
      },
      duration: {
        type: Sequelize.INTEGER
      },
      position: {
        type: Sequelize.STRING
      },
      type: {
        type: Sequelize.STRING
      },
      credits: {
        type: Sequelize.JSONB
      },
      audioUrl: {
        type: Sequelize.STRING
      },
      resourceUrl: {
        type: Sequelize.STRING
      },
      AudioMainArtistsId: {
        type: Sequelize.INTEGER,
      },
      VinylId: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        type: Sequelize.DATEONLY,
        defaultValue: new Date()
      }
    });

    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('Audios', {
      fields: ['AudioMainArtistsId'],
      type: 'foreign key',
      name: 'Audios_AudioMainArtistsId_fkey',
      references: {
        table: 'Artists',
        field: 'id'
      }
    });

    await queryInterface.addConstraint('Audios', {
      fields: ['VinylId'],
      type: 'foreign key',
      name: 'Audios_VinylId_fkey',
      references: {
        table: 'Vinyls',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Audios', 'Audios_AudioMainArtistsId_fkey');
    await queryInterface.removeConstraint('Audios', 'Audios_VinylId_fkey');

    await queryInterface.dropTable('Audios');
  }
};