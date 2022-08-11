'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FormatDescription extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { FormatInVinyl, FormatDescription, DecriptionInFormaVinyl } = models;

      FormatDescription.belongsToMany(FormatInVinyl, {
        // through: DecriptionInFormaVinyl,
        through: DecriptionInFormaVinyl, foreignKey: 'FormatDescriptionId'
        // through: DecriptionInFormaVinyl, foreignKey: 'FormatDescriptionId', otherKey: ['FormatInVinylsVinylId', 'FormatInVinylsFormatId']
        // through: DecriptionInFormaVinyl, foreignKey: ['FormatInVinylsVinylId', 'FormatInVinylsFormatId'], otherKey: 'FormatDescriptionId'
      })
    }
  }
  FormatDescription.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'FormatDescription',
    timestamps: false
  });
  return FormatDescription;
};