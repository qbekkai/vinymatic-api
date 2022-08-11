'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Identifier extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Vinyl, Identifier } = models;

      Identifier.belongsTo(Vinyl)
    }
  }
  Identifier.init({
    type: DataTypes.STRING,
    value: DataTypes.STRING,
    description: DataTypes.TEXT,
    VinylId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Identifier',
    updatedAt: false
  });
  return Identifier;
};