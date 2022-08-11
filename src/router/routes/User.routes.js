const multer = require('multer')
const { ValidationError, UniqueConstraintError, QueryTypes } = require('sequelize')
const fs = require('fs')
const util = require('util')

const unlinkFile = util.promisify(fs.unlink)
const { User, Collection, Playlist, sequelize } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const includeEntity = require('../relations/includeEntity')
const { haveYouThePermission } = require('../../auth/accessControl')
const BucketS3Service = require('../../files/s3')
const SellingRoutes = require('./Selling.routes')
const Tools = require('../../tools/tools')
const tools = require('../../tools/tools')
const ApiService = require('../../services/apiService')
const { URL_API, PORT_API, TOKEN_API } = process.env



const upload = multer({ dest: './src/files/uploads' })

module.exports = (router) => {
  router.route('/users')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const usersFound = await User.findAll(includeEntity.routes.user.gets)

          res.status(200).json({ users: usersFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createAny', 'user'),
      async (req, res, next) => {
        try {
          const { body } = req
          body.username = body.username ? body.username.toLowerCase() : null

          const userCreated = await User.create(body)
          await userCreated.createCollection()
          await userCreated.createWishlist()

          res.status(201).json({ user: userCreated })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/is/pseudo/available/:username')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { username } = params
          const userFound = await User.findOne({ where: { username } })
          res.status(200).send(userFound == null ? true : false)
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/user/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params
          const options = {
            attributes: {
              include: [
                [sequelize.literal(`(SELECT COUNT(*) FROM Follows WHERE FollowingId = ${id} )`), "followings"],
                [sequelize.literal(`(SELECT COUNT(*) FROM Follows WHERE FollowerId = ${id} )`), "followers"]
              ],
              exclude: ["emailToken", "verifiedEmail", "verifiedPhone", "password"]
            },
            include: [
              { model: User, as: "Followings", attributes: [], through: { attributes: [] } },
              { model: User, as: "Followers", attributes: [], through: { attributes: [] } }
            ],
            // group: ["Followings->Follows.FollowingId", "Followers->Follows.FollowerId"],
            rejectOnEmpty: true
          }

          const userFound = await User.findByPk(id, options)
          res.status(200).json({ user: userFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })
    .patch(
      haveYouThePermission('updateAny', 'user'),
      async (req, res, next) => {
        try {
          const id = req.params.id
          const options = {
            attributes: {
              include: [
                [sequelize.literal(`(SELECT COUNT(*) FROM Follows WHERE FollowingId = ${id} )`), "followings"],
                [sequelize.literal(`(SELECT COUNT(*) FROM Follows WHERE FollowerId = ${id} )`), "followers"]
              ],
              exclude: ["emailToken", "verifiedEmail", "verifiedPhone", "password"]
            },
            include: [
              { model: User, as: "Followings", attributes: [], through: { attributes: [] } },
              { model: User, as: "Followers", attributes: [], through: { attributes: [] } }
            ],
            // group: ["Followings->Follows.FollowingId", "Followers->Follows.FollowerId"],
            rejectOnEmpty: true
          }

          const userUpdate = await User.update(req.body, { where: { id: id } })
          if (userUpdate[0] === 0) throw { name: 'VinymaticApiNoModification' }

          const userFound = await User.findByPk(id, options)
          res.status(200).json({ user: userFound })
        } catch (err) {
          if (err.name.localeCompare(NO_MODIFICATION_ERROR) === 0)
            return res.status(304).json({ message: "Aucune modification apporter" })

          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteAny', 'user'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const userDelete = await User.destroy({ where: { id } })
          if (userDelete === 0 || userDelete === null || !userDelete) throw { name: 'VinymatiApiNotExist' }
          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(NOT_EXIST_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  // specific requests
  router.route('/user/:id/username')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const username = await User.findOne({ attributes: ['username'], where: { id }, rejectOnEmpty: true })
          res.status(200).json(username)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/user/:id/playlists')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: ["id", "username"],
            include: [
              { model: Playlist, attributes: ["id", "title", "duration", "image", "playlistUrl", "resourceUrl"] }
            ],
            rejectOnEmpty: true
          }
          const userFound = await User.findByPk(id, options)
          res.status(200).json({ user: userFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  /** FOLLOWER FEATURE */
  router.route('/user/:id/followings')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: ["id", "username", [sequelize.literal(`(SELECT COUNT(*) FROM Follows WHERE FollowingId = ${id} )`), "followings"]],
            include: [
              { model: User, as: "Followings", attributes: ["id", "username", "showName", "profilImage"], through: { attributes: [] } }
            ],
            rejectOnEmpty: true
          }
          const userFound = await User.findByPk(id, options)
          res.status(200).json({ user: userFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/user/:id/followers')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: ["id", "username", [sequelize.literal(`(SELECT COUNT(*) FROM Follows WHERE FollowerId = ${id} )`), "followers"]],
            include: [
              { model: User, as: "Followers", attributes: ["id", "username", "showName", "profilImage"], through: { attributes: [] } }
            ],
            rejectOnEmpty: true
          }
          const userFound = await User.findByPk(id, options)
          res.status(200).json({ user: userFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** COLLECTION FEATURE */
  router.route('/user/:id/collection')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: ["id", "username"],
            include: [
              {
                model: Collection,
                attributes: ["id"],
                include: [
                  { model: Vinyl, attributes: ["id", "title", "thumbnail"], through: { attributes: [] } }
                ]
              }
            ],
            rejectOnEmpty: true
          }

          const userFound = await User.findByPk(id, options)
          res.status(200).json({ user: userFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** WISHLIST FEATURE */
  router.route('/user/:id/wishlist')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: ["id", "username"],
            include: [
              {
                model: Wishlist,
                attributes: ["id"],
                include: [
                  { model: Vinyl, attributes: ["id", "title", "thumbnail"], through: { attributes: [] } }
                ]
              }
            ],
            rejectOnEmpty: true
          }

          const userFound = await User.findByPk(id, options)
          res.status(200).json({ user: userFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/wishlist/vinyl/:id/user/:userId')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id, userId } = params
          const options1 = {
            attributes: ["id"],
            include: [
              { model: Vinyl, attributes: ["id", "thumbnail"], through: { attributes: ["diskCondition", "coverCondition"] } }
            ],
            rejectOnEmpty: true
          }

          const options2 = {
            attributes: ["id", "username"],
            include: [
              {
                model: Wishlist,
                attributes: ["id"],
                include: [
                  { model: Vinyl, attributes: ["id", "title", "thumbnail"], through: { attributes: [] } }
                ]
              }
            ],
            rejectOnEmpty: true
          }
          const options = {
            attributes: ["id", "title", "thumbnail", "releaseDate", "country"],
            include: [
              { model: Artist, as: "VinylMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Label, as: "VinylLabels", attributes: ["id", "idLabel", "name", "thumbnail"], through: { attributes: ["catno"] } },
            ],
            rejectOnEmpty: true
          }

          const user = await await User.findByPk(userId, options2)

          const wishlistFound = await user.getWishlist(options1);
          const vinylIds = wishlistFound.dataValues.Vinyls.map(v => v.id)
          if (!vinylIds.includes(Number(id))) throw { name: "EMPTY_ERROR" }

          const vinylFound = await Vinyl.findByPk(id, options);
          const vinylInWishlist = wishlistFound.dataValues.Vinyls.find(a => a.id === Number(id))

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: `${TOKEN_API}` })
          const vinylFormatGetted = (await as.doRequest('get', `/vinyl/${id}/formats`)).data


          vinylFound.dataValues = {
            ...vinylFound.dataValues,
            Formats: vinylFormatGetted.formats,
            diskCondition: vinylInWishlist.VinylsInWishlist.diskCondition,
            coverCondition: vinylInWishlist.VinylsInWishlist.coverCondition
          }

          req.results = { vinyl: vinylFound }
          next()

        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/collection/vinyl/:id/user/:userId')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id, userId } = params
          const options1 = {
            attributes: ["id"],
            include: [
              { model: Vinyl, attributes: ["id", "thumbnail"], through: { attributes: ["diskCondition", "coverCondition"] } }
            ],
            rejectOnEmpty: true
          }

          const options2 = {
            attributes: ["id", "username"],
            include: [
              {
                model: Collection,
                attributes: ["id"],
                include: [
                  { model: Vinyl, attributes: ["id", "title", "thumbnail"], through: { attributes: [] } }
                ]
              }
            ],
            rejectOnEmpty: true
          }
          const options = {
            attributes: ["id", "title", "thumbnail", "releaseDate", "country"],
            include: [
              { model: Artist, as: "VinylMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Label, as: "VinylLabels", attributes: ["id", "idLabel", "name", "thumbnail"], through: { attributes: ["catno"] } },
            ],
            rejectOnEmpty: true
          }

          const user = await await User.findByPk(userId, options2)

          const collectionFound = await user.getCollection(options1);
          const vinylIds = collectionFound.dataValues.Vinyls.map(v => v.id)
          if (!vinylIds.includes(Number(id))) throw { name: "EMPTY_ERROR" }

          const vinylFound = await Vinyl.findByPk(id, options);
          const vinylInCollection = collectionFound.dataValues.Vinyls.find(a => a.id === Number(id))

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: `${TOKEN_API}` })
          const vinylFormatGetted = (await as.doRequest('get', `/vinyl/${id}/formats`)).data

          vinylFound.dataValues = {
            ...vinylFound.dataValues,
            Formats: vinylFormatGetted.formats,
            diskCondition: vinylInCollection.VinylsInCollection.diskCondition,
            coverCondition: vinylInCollection.VinylsInCollection.coverCondition
          }

          req.results = { vinyl: vinylFound }
          next()
          // res.status(200).json({ 
          // 	Vinyl: vinylFound,
          // 	diskCondition: vinylInCollection.VinylsInCollection.diskCondition,
          // 	coverCondition: vinylInCollection.VinylsInCollection.coverCondition
          // })

        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

}