'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FormatVoice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { FormatInVinyl, FormatVoice } = models;

      FormatVoice.hasMany(FormatInVinyl)
    }
  }
  FormatVoice.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FormatVoice',
    timestamps: false
  });
  return FormatVoice;
};