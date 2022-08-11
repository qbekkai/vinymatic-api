'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MainArtistsInMaster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MainArtistsInMaster.init({
    ArtistId: DataTypes.INTEGER,
    MasterId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MainArtistsInMaster',
    timestamps: false
  });
  return MainArtistsInMaster;
};