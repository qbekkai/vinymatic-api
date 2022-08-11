'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class CreditsInAudio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  CreditsInAudio.init({
    ArtistId: DataTypes.INTEGER,
    AudioId: DataTypes.INTEGER,
    roleCredit: DataTypes.STRING,
    typeCredit: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'CreditsInAudios',
    timestamps: false
  });
  return CreditsInAudio;
};