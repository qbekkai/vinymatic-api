'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Format extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Vinyl, Format, FormatInVinyl } = models;

      Format.hasMany(FormatInVinyl, { foreignKey: { allowNull: false } })

      Format.belongsToMany(Vinyl, { through: FormatInVinyl, updatedAt: false, createdAt: false })

    }
  }
  Format.init({
    name: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Format',
    timestamps: false
  });
  return Format;
};