'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Label extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Vinyl, Label, SocietesInVinyl, LabelsInVinyl, Serie } = models;

      Label.belongsToMany(Vinyl, { through: LabelsInVinyl, as: "VinylLabels" });
      Label.belongsToMany(Vinyl, { through: SocietesInVinyl, as: "VinylSocietes" });
      Label.belongsToMany(Vinyl, { through: Serie, as: "VinylSeries" });

    }
  }
  Label.init({
    idLabel: {
      type: DataTypes.INTEGER,
      unique: {
        msg: 'Le label existe déjà'
      }
    },
    name: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    images: DataTypes.JSON,
    verify: DataTypes.BOOLEAN,
    updatedAt: {
      type: DataTypes.DATEONLY,
      defaultValue: new Date()
    },
    createdAt: {
      type: DataTypes.DATEONLY,
      defaultValue: new Date()
    }
  }, {
    sequelize,
    modelName: 'Label'
  });
  return Label;
};