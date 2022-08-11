const { Genre } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const includeEntity = require('../relations/includeEntity')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const { haveYouThePermission } = require('../../auth/accessControl')


module.exports = (router) => {
  router.route('/genres')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Genre']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const options = { attributes: ["id", "name"] }
          const genres = await Genre.findAll(options)
          res.status(200).json({ genres })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/genre/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Genre']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const { id } = req.params
          const options = {
            attributes: ["id", "name"],
            include: [
              { model: Master, attributes: ["id", "idMaster", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Vinyl, attributes: ["id", "idRelease", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: [] } }
            ],
            rejectOnEmpty: true
          }
          const genre = await Genre.findByPk(id, options)
          res.status(200).json({ genre })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/genre/:nameGenre/styles')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Genre']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const { params } = req
          const options = {
            attributes: ['id', 'name'],
            include: [{ model: Style, attributes: ['id', 'name'] }],
            where: { name: params.nameGenre },
            rejectOnEmpty: true
          }
          const genre = await Genre.findOne(options)
          res.status(200).json({ genre })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}

