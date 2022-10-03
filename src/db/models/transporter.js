'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Transporter extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Transporter, User, UserTransporter } = models;

      Transporter.belongsToMany(User, { through: UserTransporter, as: "Transporters" })
    }
  }
  Transporter.init({
    name: DataTypes.STRING,
    image: DataTypes.STRING,
    deliveryDelay: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'Transporter',
    timestamps: false
  });
  return Transporter;
};