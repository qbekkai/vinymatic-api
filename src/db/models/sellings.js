'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Selling extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Selling, User, Vinyl } = models

      Selling.belongsTo(User)
      Selling.belongsTo(Vinyl)
    }
  }
  Selling.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    itemWeight: DataTypes.FLOAT,
    price: DataTypes.FLOAT,
    devise: DataTypes.STRING,
    quantity: DataTypes.INTEGER,
    additionalImages: DataTypes.JSON,
    diskCondition: DataTypes.STRING,
    coverCondition: DataTypes.STRING,
    isSelled: DataTypes.BOOLEAN,
    UserId: DataTypes.INTEGER,
    VinylId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Selling',
  });
  return Selling;
};