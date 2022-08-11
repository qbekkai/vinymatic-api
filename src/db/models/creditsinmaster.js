'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CreditsInMaster extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CreditsInMaster.init({
    ArtistId: DataTypes.INTEGER,
    MasterId: DataTypes.INTEGER,
    roleCredit: DataTypes.STRING,
    typeCredit: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CreditsInMaster',
    timestamps: false
  });
  return CreditsInMaster;
};