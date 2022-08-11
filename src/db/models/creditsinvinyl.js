'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CreditsInVinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CreditsInVinyl.init({
    ArtistId: DataTypes.INTEGER,
    VinylId: DataTypes.INTEGER,
    roleCredit: DataTypes.JSON,
    typeCredit: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CreditsInVinyl',
    timestamps: false
  });
  return CreditsInVinyl;
};