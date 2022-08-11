const { ValidationError, UniqueConstraintError } = require('sequelize')
const { Identifier, Vinyl } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const { haveYouThePermission } = require('../../auth/accessControl')


module.exports = (router) => {
  router.route('/identifiers/types')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const options = {
            attributes: ["type"],
            group: ["Identifier.type"],
          }
          let identifierTypes = await Identifier.findAll(options)
          identifierTypes = identifierTypes.map(i => {
            const intetifier = i
            intetifier.dataValues = intetifier.dataValues.type
            return intetifier
          })

          res.status(200).json({ identifierTypes })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}
