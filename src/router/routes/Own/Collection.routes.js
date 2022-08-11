const { Vinyl } = require('./../../../db/models')
const ErrorMessage = require('../../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../../error/constError')
const { haveYouThePermission } = require('../../../auth/accessControl')
const tools = require('./../../../tools/tools')
const ApiService = require('../../../services/apiService')
const { URL_API, PORT_API, TOKEN_API } = process.env



module.exports = (router) => {

  /** ITEMS OPPERATION */
  router.route('/own/collection')
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

          const collectionFound = await user.getCollection(options);
          res.status(200).json({ own: user, Collection: collectionFound })

        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/collection/vinyl/:id')
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

          const collectionFound = await user.getCollection(options1);
          const vinylIds = collectionFound.dataValues.Vinyls.map(v => v.id)
          if (!vinylIds.includes(Number(id))) throw { name: "EMPTY_ERROR" }

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: `${TOKEN_API}` })
          const vinylFormatGetted = (await as.doRequest('get', `/vinyl/${id}/formats`)).data


          const vinylFound = await Vinyl.findByPk(id, options);
          const vinylInCollection = collectionFound.dataValues.Vinyls.find(a => a.id === Number(id))
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

  router.route('/own/collection/vinyl/:vinylId')
    .post(
      haveYouThePermission('createOwn', 'collection:vinyl'),
      async (req, res, next) => {
        try {
          const { params, user, body } = req
          const { vinylId } = params
          const { coverCondition, diskCondition } = body

          let collectionGetted = await user.getCollection({ rejectOnEmpty: true })
          const vinylFound = await Vinyl.findByPk(vinylId, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          const vinylAdded = await collectionGetted.addVinyl(vinylFound, { through: { coverCondition, diskCondition } })
          if (!vinylAdded) throw { name: "VinymatiApiAlreadyExist", resource: vinylFound }

          res.status(201).json({ user, vinylAdded: { id: vinylFound.id, title: vinylFound.title, thumbnail: vinylFound.thumbnail } })
        } catch (err) {
          if (err.name.localeCompare(ALREADY_EXIST_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteOwn', 'collection:vinyl'),
      async (req, res, next) => {
        try {
          const { params, user } = req
          const { vinylId } = params

          let collectionGetted = await user.getCollection({ rejectOnEmpty: true })
          const vinylFound = await Vinyl.findByPk(vinylId, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          const vinylRemoved = await collectionGetted.removeVinyl(vinylFound)
          if (vinylRemoved === 0) throw { name: "VinymatiApiNotExist" }

          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}