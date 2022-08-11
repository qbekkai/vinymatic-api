const { Format } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const includeEntity = require('../relations/includeEntity')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const { haveYouThePermission } = require('../../auth/accessControl')

module.exports = (router) => {
  router.route('/formats')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Format']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const formats = await Format.findAll(includeEntity.routes.format.gets)
          res.json({ formats })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Format']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const { body } = req
          const format = await Format.create(body)
          res.status(201).json({ format })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/format/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Format']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const { id } = req.params
          const options = {
            attributes: ["id", "name", "description"],
            include: [
              { model: Vinyl, attributes: ["id", "idRelease", "title", "thumbnail"], through: { attributes: [] } },
            ],
            rejectOnEmpty: true
          }
          const format = await Format.findByPk(id, options)

          res.json({ message: ErrorMessage.getMessageByStatusCode(200), data: format })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      haveYouThePermission('updateAny', 'all'),
      async (req, res, next) => {
        /**
         *  #swagger.tags = ['Format']
         *  #swagger.responses[401]
         *  #swagger.security = [{ "bearerAuth": [] }]
         */
        try {
          const { body } = req
          const { id } = req.params

          await Format.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })
          const toUpdate = await Format.update(body, { where: { id: id } })
          if (toUpdate == null || toUpdate[0] === 0) throw { name: "VinymaticApiNoModification" }

          const formatUpdated = await Format.findByPk(id, { rejectOnEmpty: true })
          res.json({ format: formatUpdated })
        } catch (err) {
          if (err.name.localeCompare(NO_MODIFICATION_ERROR) === 0)
            return res.status(304).json({ message: "Aucune modification apporter" })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}

