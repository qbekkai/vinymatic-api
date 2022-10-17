'use strict';
const dateTool = require('./../../tools/date.tool')


const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Vinyl extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const {
        User,
        Master,
        Vinyl,
        Audio,
        Format,
        Genre,
        Label,
        Artist,
        Style,
        CreditsInVinyl,
        LabelsInVinyl,
        SocietesInVinyl,
        Selling,
        Collection,
        Wishlist,
        VinylsInCollection,
        VinylsInWishlist,
        Serie,
        Identifier,
        FormatInVinyl,
        MainArtistsInVinyl,
        VinylsAsGenre,
        VinylsAsStyle,
        VinylLike
      } = models;

      Vinyl.hasMany(Audio)

      Vinyl.hasMany(Selling)
      Vinyl.hasMany(Identifier)
      Vinyl.hasMany(FormatInVinyl, { foreignKey: { allowNull: false } })

      Vinyl.belongsTo(Master)


      Vinyl.belongsToMany(Artist, { through: MainArtistsInVinyl, as: "VinylMainArtists" })
      Vinyl.belongsToMany(Artist, { through: CreditsInVinyl, as: "VinylCredits" })
      Vinyl.belongsToMany(Label, { through: SocietesInVinyl, as: "VinylSocietes" });
      Vinyl.belongsToMany(Label, { through: Serie, as: "VinylSeries" });
      Vinyl.belongsToMany(Label, { through: LabelsInVinyl, as: "VinylLabels" })
      Vinyl.belongsToMany(Format, { through: FormatInVinyl })
      Vinyl.belongsToMany(Genre, { through: VinylsAsGenre })
      Vinyl.belongsToMany(Style, { through: VinylsAsStyle })
      //   Vinyl.belongsToMany(User, { through: Selling, as: "Sells" });
      Vinyl.belongsToMany(User, { through: VinylLike, as: "VinylLikes" })

      Vinyl.belongsToMany(Collection, { through: VinylsInCollection })
      Vinyl.belongsToMany(Wishlist, { through: VinylsInWishlist })
    }
  }
  Vinyl.init({
    idRelease: {
      type: DataTypes.INTEGER,
      unique: {
        msg: 'L\'article existe déjà'
      }
    },
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    country: DataTypes.STRING,
    releaseDate: {
      type: DataTypes.DATE,
      set(value) {
        this.setDataValue('releaseDate', value ? dateTool.dateFormaterStringToTimestamp(value) : null);
      }
    },
    vinylUrl: DataTypes.STRING,
    resourceUrl: DataTypes.STRING,
    images: {
      type: DataTypes.JSON,
      defaultValue: []
    },
    thumbnail: {
      type: DataTypes.STRING,
      defaultValue: ''
    },
    MasterId: DataTypes.INTEGER,
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: new Date()
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: new Date()
    }
  }, {
    sequelize,
    modelName: 'Vinyl',
  });
  return Vinyl;
};