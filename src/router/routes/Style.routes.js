const { Style } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const includeEntity = require('../relations/includeEntity')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const { haveYouThePermission } = require('../../auth/accessControl')

module.exports = (router) => {
  router.route('/styles')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Style']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const styles = await Style.findAll(includeEntity.routes.style.gets)
          res.status(200).json({ styles })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    <

    /** ITEMS OPPERATION */
    router.route('/style/:id')
      .get(
        haveYouThePermission('readAny', 'all'),
        async (req, res, next) => {
          /**
           *  #swagger.tags = ['Style']
           *  #swagger.responses[401]
           *  #swagger.security = [{ "bearerAuth": [] }]
           */
          try {
            const { id } = req.params
            const options = {
              attributes: ["id", "name"],
              include: [
                { model: Master, attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"], through: { attributes: [] } },
                { model: Vinyl, attributes: ["id", "idRelease", "title", "country", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: [] } },
                { model: Genre, attributes: ["id", "name"] },
              ],
              rejectOnEmpty: true
            }
            const styles = await Style.findByPk(id, options)
            res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200), data: styles })
          } catch (err) {
            if (err.name.localeCompare(EMPTY_ERROR) === 0)
              return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

            return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
          }
        })
}

// VinylsAsStyles
// MastersAsStyles

