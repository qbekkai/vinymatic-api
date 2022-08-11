'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FormatSize extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { FormatInVinyl, FormatSize } = models;

      FormatSize.hasMany(FormatInVinyl)
    }
  }
  FormatSize.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FormatSize',
    timestamps: false
  });
  return FormatSize;
};