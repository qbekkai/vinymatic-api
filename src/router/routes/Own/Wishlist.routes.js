const { Vinyl } = require('./../../../db/models')
const ErrorMessage = require('../../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../../error/constError')
const { haveYouThePermission } = require('../../../auth/accessControl')
const tools = require('./../../../tools/tools')
const ApiService = require('../../../services/apiService')
const { URL_API, PORT_API, TOKEN_API } = process.env


module.exports = (router) => {

  /** ITEMS OPPERATION */
  router.route('/own/wishlist')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { user } = req

          const options = {
            attributes: ["id"],
            include: [
              { model: Vinyl, attributes: ["id", "thumbnail"], through: { attributes: [] } }
            ],
            rejectOnEmpty: true
          }

          const wishlistFound = await user.getWishlist(options);
          res.status(200).json({ own: user, Wishlist: wishlistFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/wishlist/vinyl/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { user, params } = req
          const { id } = params
          const options1 = {
            attributes: ["id"],
            include: [
              { model: Vinyl, attributes: ["id", "thumbnail"], through: { attributes: ["diskCondition", "coverCondition"] } }
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


  router.route('/own/wishlist/vinyl/:vinylId')
    .post(
      haveYouThePermission('createOwn', 'wishlist:vinyl'),
      async (req, res, next) => {
        try {
          const { params, user, body } = req
          const { vinylId } = params
          const { coverCondition, diskCondition } = body


          let wishlistGetted = await user.getWishlist({ rejectOnEmpty: true })
          const vinylFound = await Vinyl.findByPk(vinylId, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          const vinylAdded = await wishlistGetted.addVinyl(vinylFound, { through: { coverCondition, diskCondition } })
          if (!vinylAdded) throw { name: "VinymatiApiAlreadyExist" }


          res.status(201).json({ user, vinylAdded: { id: vinylFound.id, title: vinylFound.title, thumbnail: vinylFound.thumbnail } })
        } catch (err) {
          /** TODO: add middleware */
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteOwn', 'wishlist:vinyl'),
      async (req, res, next) => {
        try {
          const { params, user } = req
          const { vinylId } = params

          let wishlistGetted = await user.getWishlist({ rejectOnEmpty: true })
          const vinylFound = await Vinyl.findByPk(vinylId, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          const vinylRemoved = await wishlistGetted.removeVinyl(vinylFound)
          if (vinylRemoved === 0) throw { name: "VinymatiApiNotExist" }

          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}