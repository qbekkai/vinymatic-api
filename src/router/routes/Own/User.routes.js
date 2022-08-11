const { URL_API, PORT_API, TOKEN_API } = process.env
const multer = require('multer')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const fs = require('fs')
const util = require('util')
const FormData = require('form-data');


const unlinkFile = util.promisify(fs.unlink)
const { UserDeliveryAddress, UserFacturationAddress, User, Video, Playlist, sequelize } = require('./../../../db/models')
const ErrorMessage = require('../../../error/messages')
const { EMPTY_ERROR, ONLY_UPDATE_PREFERENCES, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../../error/constError')
const includeEntity = require('../../relations/includeEntity')
const { haveYouThePermission } = require('../../../auth/accessControl')
const BucketS3Service = require('../../../files/s3')
const ApiService = require('../../../services/apiService')


const upload = multer({ dest: './src/files/uploads' })

module.exports = (router) => {
  /** ITEMS OPPERATION */
  router.route('/own/user')
    .get(
      haveYouThePermission('readOwn', 'user'),
      async (req, res) => {
        try {
          const { user } = req;
          const { username } = user

          const options = {
            attributes: {
              include: [
                [sequelize.fn("COUNT", sequelize.col("Followings->Follows.FollowingId")), "followings"],
                [sequelize.fn("COUNT", sequelize.col("Followers->Follows.FollowerId")), "followers"]
              ],
              exclude: ["emailToken", "verifiedEmail", "verifiedPhone", "password"]
            },
            include: [
              { model: User, as: "Followings", attributes: [], through: { attributes: [] } },
              { model: User, as: "Followers", attributes: [], through: { attributes: [] } }
            ],
            group: ["Followings->Follows.FollowingId", "Followers->Follows.FollowerId"],
            where: { username },
            rejectOnEmpty: true
          }

          const _selfUser = await User.findOne(options)
          res.status(200).json({ user: _selfUser })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })
    .patch(
      haveYouThePermission('updateOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user, body } = req;
          const { username } = user
          const options = {
            attributes: {
              include: [
                [sequelize.literal(`(SELECT count(id) FROM Follows AS f INNER JOIN Users AS u ON u.id = f.FollowingId WHERE u.username LIKE "${username}")`), "followings"],
                [sequelize.literal(`(SELECT count(id) FROM Follows AS f INNER JOIN Users AS u ON u.id = f.FollowerId WHERE u.username LIKE "${username}")`), "followers"],
              ],
              exclude: ["emailToken", "verifiedEmail", "verifiedPhone", "password"]
            },
            include: [
              { model: User, as: "Followings", attributes: [], through: { attributes: [] } },
              { model: User, as: "Followers", attributes: [], through: { attributes: [] } }
            ],
            where: { username },
            rejectOnEmpty: true
          }

          const userUpdated = await User.update(body, { where: { username }, rejectOnEmpty: true })
          const _selfUser = await User.findOne(options)
          res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { updatedRessource: true }), user: _selfUser })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteOwn', 'user'),
      // haveYouThePermission('deleteOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user } = req;
          const { username } = user

          const userDelete = await User.destroy({ where: { username } })
          if (userDelete === 0 || userDelete === null || !userDelete) throw { name: 'VinymatiApiNotExist' }
          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(NOT_EXIST_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/user/username')
    .get(
      haveYouThePermission('readOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user } = req;
          const { username } = user

          const usernameFound = await User.findOne({ attributes: ['username'], where: { username }, rejectOnEmpty: true })
          res.status(200).json(usernameFound)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/user/photo')
    .post(
      haveYouThePermission('updateOwn', 'user'),
      upload.single('profilImage'),
      async (req, res, next) => {
        try {
          const { user, file, query } = req;
          const { imageFrom = 'user', typeImage } = query
          const { username } = user
          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })

          // DELETE IMAGE IN S3 BUCKET IF IMAGE OR COVERIMAGE OF USER EXIST
          let options = {}
          if (typeImage.localeCompare('coverImage') === 0)
            options.attributes = ["coverImage"]
          else if (typeImage.localeCompare('profilImage') === 0)
            options.attributes = ["profilImage"]

          const { coverImage, profilImage } = await User.findOne({ ...options, where: { username }, rejectOnEmpty: true })

          if (coverImage) await as.doRequest('DELETE', coverImage)
          if (profilImage) await as.doRequest('DELETE', profilImage)


          // UPLOAD IMAGE IN S3 BUCKET AND SAVE IT ON DB
          const fd = new FormData()
          fd.append('image', fs.createReadStream(file.path))
          fd.append('typeImage', `${typeImage}s`)
          fd.append('imageFrom', `${imageFrom}s`)
          if (username) fd.append('username', `${username}`)

          const resImage = await as.doRequest('POST', `/images`, fd)

          // const bucketS3Service = new BucketS3Service('image')
          // const uploadResult = await bucketS3Service.uploadFile(file)
          // await unlinkFile(file.path)

          const imageUploaded = {
            [typeImage]: resImage.data.url
          }

          await User.update(imageUploaded, { where: { username } })
          const _selfUser = await User.findOne({ attributes: ["id", "username", "profilImage", "coverImage"], where: { username }, rejectOnEmpty: true })
          res.status(201).json({ user: _selfUser })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user, query } = req;
          const { typeImage } = query
          const { username } = user
          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })

          // DELETE IMAGE IN S3 BUCKET IF IMAGE OR COVERIMAGE OF USER EXIST IN DB
          let options = {}
          if (typeImage.localeCompare('coverImage') === 0)
            options.attributes = ["coverImage"]
          else if (typeImage.localeCompare('profilImage') === 0)
            options.attributes = ["profilImage"]

          const { coverImage, profilImage } = await User.findOne({ ...options, where: { username }, rejectOnEmpty: true })

          if (coverImage) await as.doRequest('DELETE', coverImage)
          if (profilImage) await as.doRequest('DELETE', profilImage)

          const imageUploaded = { [typeImage]: null }
          await User.update(imageUploaded, { where: { username } })

          const _selfUser = await User.findOne({ attributes: ["id", "username", "showName", "profilImage", "coverImage"], where: { username }, rejectOnEmpty: true })
          res.status(201).json({ user: _selfUser })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** LIKE FEATURE */
  router.route('/own/give/like')
    .post(
      haveYouThePermission('createOwn', 'like'),
      async (req, res, next) => {
        try {
          const { query, user } = req
          const { playlistId, vinylId, videoId } = query
          const { username } = user

          const userFound = await User.findOne({ where: { username }, attributes: ["id"], rejectOnEmpty: true })

          let ressourceFound, likeCreated;
          switch (true) {
            case !!playlistId && !vinylId && !videoId:
              ressourceFound = await Playlist.findByPk(playlistId, { attributes: ["id"], rejectOnEmpty: true })
              likeCreated = await ressourceFound.addPlaylistLike(userFound)
              break;
            case !!vinylId && !playlistId && !videoId:
              ressourceFound = await Vinyl.findByPk(vinylId, { attributes: ["id"], rejectOnEmpty: true })
              likeCreated = await ressourceFound.addVinylLike(userFound)
              break;
            case !!videoId && !playlistId && !vinylId:
              ressourceFound = await Video.findByPk(videoId, { attributes: ["id"], rejectOnEmpty: true })
              likeCreated = await ressourceFound.addVideoLike(userFound)
              break;
            default: throw { name: 'VinymatiApiNoOrTooMuchEntitySellected' };
          }

          res.status(201).json({ message: ErrorMessage.getMessageByStatusCode(201) })
        } catch (err) {
          if (err.name.localeCompare(NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/give/unlike')
    .delete(
      haveYouThePermission('deleteOwn', 'like'),
      async (req, res, next) => {
        try {
          const { query, user } = req
          const { playlistId, vinylId, videoId } = query
          const { username } = user

          const userFound = await User.findOne({ where: { username }, attributes: ["id"], rejectOnEmpty: true })

          let ressourceFound, likeRemoved;
          switch (true) {
            case !!playlistId && !vinylId && !videoId:
              ressourceFound = await Playlist.findByPk(playlistId, { attributes: ["id"], rejectOnEmpty: true })
              likeRemoved = await ressourceFound.removePlaylistLike(userFound)
              break;
            case !!vinylId && !playlistId && !videoId:
              ressourceFound = await Vinyl.findByPk(vinylId, { attributes: ["id"], rejectOnEmpty: true })
              likeRemoved = await ressourceFound.removeVinylLike(userFound)
              break;
            case !!videoId && !playlistId && !vinylId:
              ressourceFound = await Video.findByPk(videoId, { attributes: ["id"], rejectOnEmpty: true })
              likeRemoved = await ressourceFound.removeVideoLike(userFound)
              break;
            default: throw { name: 'VinymatiApiNoOrTooMuchEntitySellected' };
          }
          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/isLiked')
    .get(
      haveYouThePermission('readOwn', 'like'),
      async (req, res, next) => {
        try {
          const { query, user } = req
          const { playlistId, vinylId, videoId } = query
          const { username } = user

          const userFound = await User.findOne({ where: { username }, rejectOnEmpty: true })

          let ressourceFound, isLiked;
          switch (true) {
            case !!playlistId && !vinylId && !videoId:
              ressourceFound = await Playlist.findByPk(playlistId, { attributes: ["id"], rejectOnEmpty: true })
              isLiked = await ressourceFound.hasPlaylistLike(userFound)
              break;
            case !!vinylId && !playlistId && !videoId:
              ressourceFound = await Vinyl.findByPk(vinylId, { attributes: ["id"], rejectOnEmpty: true })
              isLiked = await ressourceFound.hasVinylLike(userFound)
              break;
            case !!videoId && !playlistId && !vinylId:
              ressourceFound = await Video.findByPk(videoId, { attributes: ["id"], rejectOnEmpty: true })
              isLiked = await ressourceFound.hasVideoLike(userFound)
              break;
            default: throw { name: 'VinymatiApiNoOrTooMuchEntitySellected' };
          }
          res.status(200).send(isLiked)
        } catch (err) {
          if (err.name.localeCompare(NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/preferences')
    .get(
      haveYouThePermission('readOwn', 'user:preferences'),
      async (req, res, next) => {
        try {
          const { user } = req
          const { username } = user

          const options = {
            attributes: ["preferences"],
            where: { username },
            rejectOnEmpty: true
          }
          const userFound = await User.findOne(options)

          res.status(200).json({ user: { ...user.dataValues, ...userFound.dataValues } })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      haveYouThePermission('readOwn', 'user:preferences'),
      async (req, res, next) => {
        try {
          const { user, body } = req
          const { username } = user
          let { preferences } = body
          preferences = JSON.stringify(preferences)

          if (Object.keys(body).length !== 1 && Object.keys(body)[0].localeCompare('preferences') === 0)
            throw { name: 'VinymaticApiUpdateOnlyPreferences' }

          await User.findOne({ where: { username }, attributes: ["id"], rejectOnEmpty: true })

          await User.update({ preferences }, { where: { username } })

          const options = {
            attributes: ["preferences"],
            where: { username },
            rejectOnEmpty: true
          }
          const userFound = await User.findOne(options)

          res.status(200).json({ user: { ...user.dataValues, ...userFound.dataValues } })
        } catch (err) {
          if (err.name.localeCompare(ONLY_UPDATE_PREFERENCES) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/user/store')
    .get(
      haveYouThePermission('readOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user } = req;
          const { username } = user

          const options = {
            attributes: ["id", "isPro", "siret", "tva", "societyName", "firstName", "lastName", "address", "postalCode", "town", "state", "country", "phoneNumber"],
            rejectOnEmpty: true
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })
          const userStore = await userFound.getUserStore(options)
          res.status(200).json(userStore)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0 || err.message.localeCompare('WHERE parameter "UserId" has invalid "undefined" value') === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      // haveYouThePermission('createOwn', 'like'),
      async (req, res, next) => {
        try {
          const { body, user } = req
          const { username } = user

          const options = {
            attributes: ["id"],
            rejectOnEmpty: false
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          const UserStoreCreated = await userFound.createUserStore({
            ...body
          })


          res.status(201).json({ userStore: UserStoreCreated })
        } catch (err) {
          if (err.name.localeCompare(NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      // haveYouThePermission('createOwn', 'like'),
      async (req, res, next) => {
        try {
          const { body, user } = req
          const { username } = user

          const options = {
            attributes: ["id"],
            rejectOnEmpty: false
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          const userStore = await userFound.getUserStore()

          const userStoreUpdated = await userStore.update({ ...body })

          res.status(200).json({ userStoreUpdated: userStoreUpdated })
        } catch (err) {
          if (err.name.localeCompare(NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/user/deliveryaddress')
    .get(
      haveYouThePermission('readOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user } = req;
          const { username } = user

          const options = {
            attributes: ["id", "firstName", "lastName", "address", "postalCode", "town", "state", "country", "phoneNumber"],
            rejectOnEmpty: true
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })
          const userStore = await userFound.getUserDeliveryAddresses(options)
          res.status(200).json(userStore)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0 || err.message.localeCompare('WHERE parameter "UserId" has invalid "undefined" value') === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      // haveYouThePermission('createOwn', 'like'),
      async (req, res, next) => {
        try {
          const { body, user } = req
          const { username } = user

          const options = {
            attributes: ["id"],
            rejectOnEmpty: false
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          const UserDeliveryAddressCreated = await userFound.createUserDeliveryAddress({
            ...body
          })


          res.status(201).json({ userAddress: UserDeliveryAddressCreated })
        } catch (err) {
          if (err.name.localeCompare(NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/user/deliveryaddress/:id')
    .patch(
      haveYouThePermission('readOwn', 'user:preferences'),
      async (req, res, next) => {
        try {
          const { params, body, user } = req
          const { username } = user
          const { id } = params

          const options = {
            attributes: ["id"],
            rejectOnEmpty: false
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          const userAddresses = await userFound.getUserDeliveryAddresses(options)
          const ids = userAddresses.map(a => a.id)

          if (!ids.includes(Number(id))) throw new Error('Not own address !')

          const userDeliveryAdressFound = await UserDeliveryAddress.findByPk(id)

          userDeliveryAdressFound.firstName = body.firstName ? body.firstName : userDeliveryAdressFound.firstName
          userDeliveryAdressFound.lastName = body.lastName ? body.lastName : userDeliveryAdressFound.lastName
          userDeliveryAdressFound.address = body.address ? body.address : userDeliveryAdressFound.address
          userDeliveryAdressFound.postalCode = body.postalCode ? body.postalCode : userDeliveryAdressFound.postalCode
          userDeliveryAdressFound.town = body.town ? body.town : userDeliveryAdressFound.town
          userDeliveryAdressFound.state = body.state ? body.state : userDeliveryAdressFound.state
          userDeliveryAdressFound.country = body.country ? body.country : userDeliveryAdressFound.country

          userDeliveryAdressFound.save()


          res.status(200).json({ userDeliveryAdressUpdated: userDeliveryAdressFound })
        } catch (err) {
          if (err.name.localeCompare(ONLY_UPDATE_PREFERENCES) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/user/facturationaddress')
    .get(
      haveYouThePermission('readOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user } = req;
          const { username } = user

          const options = {
            attributes: ["id", "firstName", "lastName", "address", "postalCode", "town", "state", "country"],
            rejectOnEmpty: true
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })
          const userStore = await userFound.getUserFacturationAddresses(options)
          res.status(200).json(userStore)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0 || err.message.localeCompare('WHERE parameter "UserId" has invalid "undefined" value') === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      // haveYouThePermission('createOwn', 'like'),
      async (req, res, next) => {
        try {
          const { body, user } = req
          const { username } = user

          const options = {
            attributes: ["id"],
            rejectOnEmpty: false
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          const UserDeliveryAddressCreated = await userFound.createUserFacturationAddress({
            ...body
          })


          res.status(201).json({ userAddress: UserDeliveryAddressCreated })
        } catch (err) {
          if (err.name.localeCompare(NO_OR_TOO_MUCH_ENTITY_SELECTED_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
  router.route('/own/user/facturationaddress/:id')
    .patch(
      haveYouThePermission('readOwn', 'user:preferences'),
      async (req, res, next) => {
        try {
          const { params, body, user } = req
          const { username } = user
          const { id } = params

          const options = {
            attributes: ["id"],
            rejectOnEmpty: false
          }

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          const userAddresses = await userFound.getUserFacturationAddresses(options)
          const ids = userAddresses.map(a => a.id)

          if (!ids.includes(Number(id))) throw new Error('Not own address !')

          const userFacturationAdressFound = await UserFacturationAddress.findByPk(id)

          userFacturationAdressFound.firstName = body.firstName ? body.firstName : userFacturationAdressFound.firstName
          userFacturationAdressFound.lastName = body.lastName ? body.lastName : userFacturationAdressFound.lastName
          userFacturationAdressFound.address = body.address ? body.address : userFacturationAdressFound.address
          userFacturationAdressFound.postalCode = body.postalCode ? body.postalCode : userFacturationAdressFound.postalCode
          userFacturationAdressFound.town = body.town ? body.town : userFacturationAdressFound.town
          userFacturationAdressFound.state = body.state ? body.state : userFacturationAdressFound.state
          userFacturationAdressFound.country = body.country ? body.country : userFacturationAdressFound.country

          userFacturationAdressFound.save()


          res.status(200).json({ userFacturationAdressUpdated: userFacturationAdressFound })
        } catch (err) {
          if (err.name.localeCompare(ONLY_UPDATE_PREFERENCES) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/user/policies')
    .get(
      haveYouThePermission('readOwn', 'user:preferences'),
      async (req, res, next) => {
        try {
          const { user: { username } } = req

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          const options = {
            attributes: ["policies"],
            rejectOnEmpty: false
          }
          const userPolicies = await userFound.getSalesPolicy(options)


          res.status(200).json({ user: userFound, policies: userPolicies.policies })
        } catch (err) {
          if (err.name.localeCompare(ONLY_UPDATE_PREFERENCES) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('readOwn', 'user:preferences'),
      async (req, res, next) => {
        try {
          const { user: { username }, body: { policies } } = req

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })

          await userFound.createSalesPolicy({
            policies
          })

          const options = {
            attributes: ["policies"],
            rejectOnEmpty: false
          }
          let userPolicies = await userFound.getSalesPolicy(options)
          res.status(201).json({ user: userFound, policies: userPolicies.policies })
        } catch (err) {
          if (err.name.localeCompare(ONLY_UPDATE_PREFERENCES) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

    .patch(
      haveYouThePermission('readOwn', 'user:preferences'),
      async (req, res, next) => {
        try {
          const { user: { username }, body: { policies } } = req

          const userFound = await User.findOne({ attributes: ['id', 'username'], where: { username }, rejectOnEmpty: true })
          const policiesGetted = await userFound.getSalesPolicy()

          await policiesGetted.update({ policies })

          const options = {
            attributes: ["policies"],
            rejectOnEmpty: false
          }
          const userPolicies = await userFound.getSalesPolicy(options)
          res.status(200).json({ user: userFound, policies: userPolicies.policies })
        } catch (err) {
          if (err.name.localeCompare(ONLY_UPDATE_PREFERENCES) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}

