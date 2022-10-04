'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class DecriptionInFormatVinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  DecriptionInFormatVinyl.init({
    FormatDescriptionId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FormatDescriptions',
        key: 'id'
      }
    },
    FormatInVinylVinylId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FormatInVinyls',
        key: 'VinylId'
      }
    },
    FormatInVinylFormatId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'FormatInVinyls',
        key: 'FormatId'
      }
    },
  }, {
    sequelize,
    modelName: 'DecriptionInFormatVinyl',
    timestamps: false
  });
  return DecriptionInFormatVinyl;
};