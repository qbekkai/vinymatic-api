'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { User, Collection, Vinyl, VinylsInCollection } = models;

      Collection.belongsTo(User);

      Collection.belongsToMany(Vinyl, { through: VinylsInCollection })
    }
  }
  Collection.init({
    imageUrl: DataTypes.STRING,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Collection',
  });
  return Collection;
};