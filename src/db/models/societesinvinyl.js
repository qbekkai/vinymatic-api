'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SocietesInVinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  SocietesInVinyl.init({
    LabelId: DataTypes.INTEGER,
    VinylId: DataTypes.INTEGER,
    roleSociete: DataTypes.STRING,
    typeSociete: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'SocietesInVinyl',
    timestamps: false
  });
  return SocietesInVinyl;
};