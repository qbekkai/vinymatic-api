'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Video extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Video, User, Artist, VideoLike } = models;

      Video.belongsTo(User, { as: "VideoOwner" })
      Video.belongsTo(Artist)

      Video.belongsToMany(User, { through: VideoLike, as: "VideoLikes" })

    }
  }
  Video.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    videoUrl: DataTypes.STRING,
    ArtistId: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Video',
    updatedAt: false
  });
  return Video;
};