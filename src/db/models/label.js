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
      const { User, Vinyl, Label, SocietesInVinyl, LabelsInVinyl, Serie, LabelFollower } = models;

      Label.belongsToMany(Vinyl, { through: LabelsInVinyl, as: "VinylLabels", updatedAt: false, createdAt: false });
      Label.belongsToMany(Vinyl, { through: SocietesInVinyl, as: "VinylSocietes" });
      Label.belongsToMany(Vinyl, { through: Serie, as: "VinylSeries" });
      Label.belongsToMany(User, { through: LabelFollower })
    }
  };
  Label.init({
    idLabel: {
      type: DataTypes.INTEGER,
      unique: {
        msg: 'Le label existe déjà'
      }
    },
    name: DataTypes.STRING,
    thumbnail: DataTypes.STRING,
    images: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Label',
    updatedAt: false,
    createdAt: false
  });
  return Label;
};