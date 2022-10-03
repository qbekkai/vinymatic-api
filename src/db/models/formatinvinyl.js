'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class FormatInVinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Vinyl, Format, FormatInVinyl, FormatDescription, FormatSide, FormatSize, FormatSpeed, FormatVoice, DecriptionInFormaVinyl } = models;

      FormatInVinyl.belongsTo(Vinyl)
      FormatInVinyl.belongsTo(Format)
      FormatInVinyl.belongsTo(FormatSide)
      FormatInVinyl.belongsTo(FormatSize)
      FormatInVinyl.belongsTo(FormatSpeed)
      FormatInVinyl.belongsTo(FormatVoice)

      FormatInVinyl.belongsToMany(FormatDescription, {
        through: DecriptionInFormaVinyl,
        // through: DecriptionInFormaVinyl, foreignKey: ['FormatInVinylsVinylId', 'FormatInVinylsFormatId']
        // through: DecriptionInFormaVinyl, foreignKey: ['FormatInVinylsVinylId', 'FormatInVinylsFormatId'], otherKey: 'FormatDescriptionId'
        // through: DecriptionInFormaVinyl, foreignKey: 'FormatDescriptidonId', otherKey: ['FormatInVinylsVinylId', 'FormatInVinylsFormatId']
      })
    }
  }
  FormatInVinyl.init({
    VinylId: DataTypes.INTEGER,
    FormatId: DataTypes.INTEGER,
    nbFormat: DataTypes.INTEGER,
    text: DataTypes.TEXT,
    FormatSideId: DataTypes.INTEGER,
    FormatSizeId: DataTypes.INTEGER,
    FormatSpeedId: DataTypes.INTEGER,
    FormatVoiceId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'FormatInVinyl',
    timestamps: false
  });
  return FormatInVinyl;
};