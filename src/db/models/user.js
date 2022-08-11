'use strict';
const bcrypt = require('bcrypt');

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      const {
        UserFacturationAddress,
        UserDeliveryAddress,
        UserStore,
        Transporter,
        User,
        Playlist,
        Vinyl,
        Selling,
        Collection,
        Wishlist,
        Video,
        ModifEntityRequest,
        Artist,
        SalesPolicy,
        PlaylistLike,
        VideoLike,
        VinylLike,
        Follow,
        UserTransporter,
        ArtistFollower,
      } = models;

      User.hasOne(Collection)
      User.hasOne(Wishlist)
      User.hasOne(SalesPolicy)
      User.hasOne(UserStore)

      User.hasMany(Selling)
      User.hasMany(UserFacturationAddress)
      User.hasMany(UserDeliveryAddress)

      User.hasMany(Playlist)
      User.hasMany(Video, { as: "VideoOwner" })
      User.hasMany(ModifEntityRequest)

      /** TODO: Unifomiser Like(s) vers PlaylistLike(s) */
      User.belongsToMany(Playlist, { through: PlaylistLike })
      User.belongsToMany(Video, { through: VideoLike, as: "VideoLikes" })
      User.belongsToMany(Vinyl, { through: VinylLike, as: "VinylLikes" })
      //   User.belongsToMany(Vinyl, { through: Selling, as: "Sells" });
      User.belongsToMany(User, { through: Follow, as: "Followers", foreignKey: 'FollowerId', otherKey: "FollowingId" })
      User.belongsToMany(User, { through: Follow, as: "Followings", foreignKey: 'FollowingId', otherKey: "FollowerId" })
      User.belongsToMany(Transporter, { through: UserTransporter, as: "Transporters" })
      User.belongsToMany(Artist, { through: ArtistFollower })
    }
  }
  User.init({
    username: {
      type: DataTypes.STRING,
      unique: {
        msg: `L'utilisateur existe déjà,`
      }
    },
    email: {
      type: DataTypes.STRING,
      unique: {
        msg: `L'utilisateur existe déjà,`
      }
    },
    phoneNumber: {
      type: DataTypes.STRING,
      unique: {
        msg: `L'utilisateur existe déjà,`
      },
      set(value) {
        let phoneNumFormated = null
        if (/^0\d/.test(value)) phoneNumFormated = `+33${value.slice(1)}`
        else if (/^\+\d{1,3}/.test(value)) phoneNumFormated = value

        if (/\.|\s/g.test(phoneNumFormated))
          phoneNumFormated = phoneNumFormated.replace(/\.|\s/g, '')

        if (phoneNumFormated) this.setDataValue('phoneNumber', phoneNumFormated);
        else this.setDataValue('phoneNumber', value)
      }, get() {
        const phoneNum = this.getDataValue('phoneNumber');
        if (phoneNum)
          return phoneNum.trim().match(/^(\+33)\s?(\d)\s?(\d{2})\s?(\d{2})\s?(\d{2})\s?(\d{2})$/).slice(1, 7).join(' ')
      }
    },
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    showName: DataTypes.STRING,
    birthDate: {
      type: DataTypes.DATEONLY,
      set(value) {
        const ts = dateTool.dateFormaterStringToTimestamp(value);
        this.setDataValue('birthDate', ts);
      }
    },
    role: DataTypes.STRING,
    profilImage: DataTypes.STRING,
    note: DataTypes.INTEGER,
    localisation: DataTypes.STRING,
    description: DataTypes.TEXT,
    coverImage: DataTypes.TEXT,
    password: {
      type: DataTypes.STRING,
      set(value) {
        const hash = bcrypt.hashSync(value, 10);
        this.setDataValue('password', hash);
      }
    },
    emailToken: DataTypes.STRING,
    verifiedEmail: DataTypes.BOOLEAN,
    verifiedPhone: DataTypes.BOOLEAN,
    userAppleId: DataTypes.STRING,
    userGoogleId: DataTypes.STRING,
    preferences: DataTypes.JSON
  }, {
    sequelize,
    modelName: 'User',
  });
  return User;
};