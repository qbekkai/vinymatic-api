'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Audio extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const { Vinyl, Audio, Artist, Playlist, AudiosInPlaylist, CreditsInAudios } = models;

      Audio.belongsTo(Vinyl)
      Audio.belongsTo(Artist, { as: "AudioMainArtists" })

      Audio.belongsToMany(Playlist, { through: AudiosInPlaylist })
      Audio.belongsToMany(Artist, { through: CreditsInAudios, as: "AudioCredits" })
    }
  }
  Audio.init({
    title: DataTypes.STRING,
    mainTitle: DataTypes.STRING,
    subTitle: DataTypes.STRING,
    description: DataTypes.TEXT,
    image: DataTypes.STRING,
    duration: DataTypes.INTEGER,
    position: DataTypes.STRING,
    type: DataTypes.STRING,
    credits: DataTypes.JSON,
    audioUrl: DataTypes.STRING,
    resourceUrl: DataTypes.STRING,
    AudioMainArtistsId: DataTypes.INTEGER,
    VinylId: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Audio',
    timestamps: false
  });
  return Audio;
};