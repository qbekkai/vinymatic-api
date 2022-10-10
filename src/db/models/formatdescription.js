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
      const { FormatInVinyl, FormatDescription, DecriptionInFormatVinyl } = models;

      FormatDescription.belongsToMany(FormatInVinyl, {
        // through: DecriptionInFormatVinyl,
        through: DecriptionInFormatVinyl, foreignKey: 'FormatDescriptionId'
        // through: DecriptionInFormatVinyl, foreignKey: 'FormatDescriptionId', otherKey: ['FormatInVinylVinylId', 'FormatInVinylFormatId']
        // through: DecriptionInFormatVinyl, foreignKey: ['FormatInVinylVinylId', 'FormatInVinylFormatId'], otherKey: 'FormatDescriptionId'
      })
      FormatDescription.hasMany(DecriptionInFormatVinyl)
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