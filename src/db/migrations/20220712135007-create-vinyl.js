'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Vinyls', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      idRelease: {
        type: Sequelize.INTEGER,
        unique: true
      },
      title: {
        type: Sequelize.STRING
      },
      description: {
        type: Sequelize.TEXT
      },
      country: {
        type: Sequelize.STRING
      },
      releaseDate: {
        type: Sequelize.DATE
      },
      vinylUrl: {
        type: Sequelize.STRING
      },
      resourceUrl: {
        type: Sequelize.STRING
      },
      images: {
        type: Sequelize.JSON
      },
      thumbnail: {
        type: Sequelize.STRING
      },
      verify: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      MasterId: {
        type: Sequelize.INTEGER,
      },
      createdAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      },
      updatedAt: {
        type: Sequelize.DATE,
        defaultValue: new Date()
      }
    });

    //! CONTRAINT : PK & FK
    await queryInterface.addConstraint('Vinyls', {
      fields: ['MasterId'],
      type: 'foreign key',
      name: 'Vinyls_MasterId_fkey',
      references: {
        table: 'Masters',
        field: 'id'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.removeConstraint('Vinyls', 'Vinyls_MasterId_fkey');

    await queryInterface.dropTable('Vinyls');
  }
};