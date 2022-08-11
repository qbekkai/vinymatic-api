'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DecriptionInFormaVinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DecriptionInFormaVinyl.init({
    FormatDescriptionId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FormatDescriptions',
        key: 'id'
      }
    },
    FormatInVinylsVinylId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FormatInVinyls',
        key: 'VinylId'
      }
    },
    FormatInVinylsFormatId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FormatInVinyls',
        key: 'FormatId'
      }
    },
  }, {
    sequelize,
    modelName: 'DecriptionInFormaVinyl',
    timestamps: false
  });
  return DecriptionInFormaVinyl;
};