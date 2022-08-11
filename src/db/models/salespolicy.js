'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class SalesPolicy extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { User, SalesPolicy } = models;

      SalesPolicy.belongsTo(User)
    }

  };
  SalesPolicy.init({
    policies: {
      type: DataTypes.JSON,
      get() { return JSON.parse(this.getDataValue('policies')); },
      set(value) { this.setDataValue('policies', JSON.stringify(value)); }
    },
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'SalesPolicy',
    tableName: 'SalesPolicies',
  });
  return SalesPolicy;
};