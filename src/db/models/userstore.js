'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class UserStore extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { User, UserStore } = models;
      UserStore.belongsTo(User);
    }
  }
  UserStore.init({
    isPro: DataTypes.BOOLEAN,
    siret: DataTypes.STRING,
    tva: DataTypes.STRING,
    societyName: DataTypes.STRING,
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
    modelName: 'UserStore',
  });
  return UserStore;
};