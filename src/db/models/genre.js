'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Genre extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Master, Vinyl, Genre, Style, MastersAsGenre, VinylsAsGenre } = models;

      Genre.hasMany(Style, { updatedAt: false, createdAt: false });

      Genre.belongsToMany(Master, { through: MastersAsGenre, updatedAt: false, createdAt: false });
      Genre.belongsToMany(Vinyl, { through: VinylsAsGenre, updatedAt: false, createdAt: false });

    }
  }
  Genre.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Genre',
    timestamps: false
  });
  return Genre;
};