'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AudiosInPlaylist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AudiosInPlaylist.init({
    AudioId: DataTypes.INTEGER,
    PlaylistId: DataTypes.INTEGER,
    position: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'AudiosInPlaylist',
    timestamps: false
  });
  return AudiosInPlaylist;
};