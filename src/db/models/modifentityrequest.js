'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ModifEntityRequest extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { ModifEntityRequest, User } = models;

      ModifEntityRequest.belongsTo(User);
    }
  }
  ModifEntityRequest.init({
    entity: DataTypes.STRING,
    idEntity: DataTypes.INTEGER,
    body: DataTypes.JSON,
    query: DataTypes.JSON,
    published: DataTypes.BOOLEAN,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'ModifEntityRequest',
  });
  return ModifEntityRequest;
};