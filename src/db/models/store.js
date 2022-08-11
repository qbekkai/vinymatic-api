'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Store extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Store.init({
    placeId: DataTypes.STRING,
    name: DataTypes.STRING,
    descript: DataTypes.TEXT,
    images: DataTypes.JSON,
    formattedAddress: DataTypes.STRING,
    geometry: DataTypes.JSON,
    rating: DataTypes.FLOAT,
    userRatingsTotal: DataTypes.INTEGER,
    hours: DataTypes.JSON,
    contacts: DataTypes.JSON,
    types: DataTypes.JSON,
    genres: DataTypes.JSON,
    formats: DataTypes.JSON,
    styles: DataTypes.JSON,
    mainSells: DataTypes.JSON,
    otherSells: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Store',
  });
  return Store;
};