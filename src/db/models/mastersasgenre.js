'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class MastersAsGenre extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  MastersAsGenre.init({
    MasterId: DataTypes.INTEGER,
    GentreId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'MastersAsGenre',
    timestamps: false
  });
  return MastersAsGenre;
};