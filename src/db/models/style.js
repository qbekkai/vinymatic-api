'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Style extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Master, Vinyl, Genre, Style, MastersAsStyle, VinylsAsStyle } = models;

      Style.belongsTo(Genre);

      Style.belongsToMany(Master, { through: MastersAsStyle });
      Style.belongsToMany(Vinyl, { through: VinylsAsStyle });

    }
  }
  Style.init({
    name: DataTypes.STRING,
    GenreId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Style',
    timestamps: false
  });
  return Style;
};