'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VerifEmailUserCode extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VerifEmailUserCode.init({
    email: DataTypes.STRING,
    code: DataTypes.INTEGER,
    exp: DataTypes.INTEGER,
    isUsed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'VerifEmailUserCode',
    updatedAt: false,
  });
  return VerifEmailUserCode;
};