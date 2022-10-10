'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class LabelsInVinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  LabelsInVinyl.init({
    LabelId: DataTypes.INTEGER,
    VinylId: DataTypes.INTEGER,
    catno: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'LabelsInVinyl',
    timestamps: false
  });
  return LabelsInVinyl;
};