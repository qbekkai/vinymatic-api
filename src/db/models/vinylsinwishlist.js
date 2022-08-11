'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class VinylsInWishlist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  VinylsInWishlist.init({
    VinylId: DataTypes.INTEGER,
    WishlistId: DataTypes.INTEGER,
    coverCondition: DataTypes.STRING,
    diskCondition: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'VinylsInWishlist',
    timestamps: false
  });
  return VinylsInWishlist;
};