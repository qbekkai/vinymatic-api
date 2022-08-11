'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserFacturationAddress extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { User, UserFacturationAddress } = models;
      UserFacturationAddress.belongsTo(User);
    }
  };
  UserFacturationAddress.init({
	firstName: DataTypes.STRING,
	lastName: DataTypes.STRING,
	address: DataTypes.STRING,
	postalCode: DataTypes.STRING,
	town: DataTypes.STRING,
	state: DataTypes.STRING,
	country: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'UserFacturationAddress',
  });
  return UserFacturationAddress;
};