'use strict';
const dateTool = require('./../../tools/date.tool')

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Master extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Master, Vinyl, Genre, Style, Artist, CreditsInMaster, MainArtistsInMaster, MastersAsGenre, MastersAsStyle } = models;

      Master.hasMany(Vinyl)

      Master.belongsToMany(Artist, { through: MainArtistsInMaster, as: "MasterMainArtists" })
      Master.belongsToMany(Artist, { through: CreditsInMaster, as: "MasterCredits" })
      Master.belongsToMany(Genre, { through: MastersAsGenre })
      Master.belongsToMany(Style, { through: MastersAsStyle })

    }
  }
  Master.init({
    idMaster: {
      type: DataTypes.INTEGER,
      unique: {
        msg: 'Le master existe déjà'
      }
    },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    releaseDate: {
      type: DataTypes.DATEONLY,
      set(value) {
        this.setDataValue('releaseDate', value ? dateTool.dateFormaterStringToTimestamp(value) : null);
      }
    },
    masterUrl: DataTypes.STRING,
    resourceUrl: DataTypes.STRING,
    images: DataTypes.JSON,
    thumbnail: DataTypes.STRING,
    tracklist: DataTypes.JSON,
    updatedAt: {
      type: DataTypes.DATEONLY,
      defaultValue: new Date()
    },
    createdAt: {
      type: DataTypes.DATEONLY,
      defaultValue: new Date()
    }
  }, {
    sequelize,
    modelName: 'Master',
  });
  return Master;
};