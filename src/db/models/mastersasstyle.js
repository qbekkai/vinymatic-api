'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MastersAsStyle extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MastersAsStyle.init({
    MasterId: DataTypes.INTEGER,
    StyleId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MastersAsStyle',
    timestamps: false
  });
  return MastersAsStyle;
};