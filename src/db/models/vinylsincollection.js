'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VinylsInCollection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VinylsInCollection.init({
    VinylId: DataTypes.INTEGER,
    CollectionId: DataTypes.INTEGER,
    coverCondition: DataTypes.STRING,
    diskCondition: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VinylsInCollection',
    timestamps: false
  });
  return VinylsInCollection;
};