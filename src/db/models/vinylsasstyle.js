'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VinylsAsStyle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VinylsAsStyle.init({
    VinylId: DataTypes.INTEGER,
    StyleId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'VinylsAsStyle',
    timestamps: false
  });
  return VinylsAsStyle;
};