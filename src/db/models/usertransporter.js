'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserTransporter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  UserTransporter.init({
    UserId: DataTypes.INTEGER,
    TransporterId: DataTypes.INTEGER,
    freeCondition: DataTypes.FLOAT,
    continents: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'UserTransporter',
  });
  return UserTransporter;
};