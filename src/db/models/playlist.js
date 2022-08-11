'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Playlist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { User, Audio, Playlist, AudiosInPlaylist, PlaylistLike } = models;

      Playlist.belongsTo(User, { as: 'Owner', foreignKey: 'UserId' })

      Playlist.belongsToMany(Audio, { through: AudiosInPlaylist })
      Playlist.belongsToMany(User, { through: PlaylistLike })

    }
  }
  Playlist.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    duration: DataTypes.INTEGER,
    image: DataTypes.STRING,
    playlistUrl: DataTypes.STRING,
    resourceUrl: DataTypes.STRING,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Playlist',
  });
  return Playlist;
};