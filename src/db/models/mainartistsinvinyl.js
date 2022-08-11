'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MainArtistsInVinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MainArtistsInVinyl.init({
    ArtistId: DataTypes.INTEGER,
    VinylId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MainArtistsInVinyl',
    timestamps: false
  });
  return MainArtistsInVinyl;
};