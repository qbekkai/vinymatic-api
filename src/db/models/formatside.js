'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FormatSide extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { FormatInVinyl, FormatSide } = models;

      FormatSide.hasMany(FormatInVinyl)
    }
  }
  FormatSide.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FormatSide',
    timestamps: false
  });
  return FormatSide;
};