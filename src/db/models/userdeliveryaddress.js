'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserDeliveryAddress extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { User, UserDeliveryAddress } = models;
      UserDeliveryAddress.belongsTo(User);
    }
  }
  UserDeliveryAddress.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    address: DataTypes.STRING,
    postalCode: DataTypes.STRING,
    town: DataTypes.STRING,
    state: DataTypes.STRING,
    country: DataTypes.STRING,
    phoneNumber: DataTypes.STRING,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'UserDeliveryAddress',
    tableName: 'UserDeliveryAddresses',
  });
  return UserDeliveryAddress;
};