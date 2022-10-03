'use strict';
const {
  Model, BOOLEAN
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Artist extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const {
        User,
        Video,
        Vinyl,
        Artist,
        Master,
        Audio,
        CreditsInVinyl,
        CreditsInMaster,
        CreditsInAudios,
        MainArtistsInMaster,
        MainArtistsInVinyl,
        ArtistFollower
      } = models;

      Artist.hasMany(Audio, { as: "AudioMainArtists", foreignKey: "AudioMainArtistsId" })
      Artist.hasMany(Video)

      Artist.belongsToMany(Master, { through: MainArtistsInMaster, as: "MasterMainArtists" })
      Artist.belongsToMany(Vinyl, { through: MainArtistsInVinyl, as: "VinylMainArtists" })
      Artist.belongsToMany(Master, { through: CreditsInMaster, as: "MasterCredits" })
      Artist.belongsToMany(Vinyl, { through: CreditsInVinyl, as: "VinylCredits" })
      Artist.belongsToMany(Audio, { through: CreditsInAudios, as: "AudioCredits" })
      Artist.belongsToMany(User, { through: ArtistFollower })

    }
  }
  Artist.init({
    idArtist: {
      type: DataTypes.INTEGER,
      unique: {
        msg: 'L\'artiste existe déjà'
      }
    },
    name: DataTypes.STRING,
    fullName: DataTypes.STRING,
    aliasNames: DataTypes.JSON,
    variantNames: DataTypes.JSON,
    description: DataTypes.TEXT,
    inGroups: DataTypes.JSON,
    images: DataTypes.JSON,
    thumbnail: DataTypes.STRING,
    artistUrl: DataTypes.STRING,
    resourceUrl: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Artist',
    timestamps: false
  });
  return Artist;
};