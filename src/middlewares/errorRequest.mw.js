const ErrorMessage = require('../error/messages')
const { ValidationError, UniqueConstraintError } = require('sequelize')


const EMPTY_ERROR = "SequelizeEmptyResultError"

const REFERENCE_ERROR = "ReferenceError"

const MALFORMED_TOKEN_ERROR = "TokenMalformed"
const EXPIRED_TOKEN_ERROR = "TokenExpired"
const IS_LOGIN_ERROR = "TokenIsLogin"

const NO_CRITRIA_ERROR = "VinymatiApiNoCriteriaError"
const ALREADY_EXIST_ERROR = "VinymatiApiAlreadyExist"
const NOT_EXIST_ERROR = "VinymatiApiNotExist"
const NO_MODIFICATION_ERROR = "VinymaticApiNoModification"
const NO_ENTITY_SELECTED_ERROR = "VinymatiApiNoEntitySellected"
const ANONYMOUS_USER_ERROR = "VinymatiApiAnonymousUser"


module.exports = async (err, req, res, next) => {
  if (err) {
    console.log("MW: Gestion erreur")
    if (err && (err.isError || err.stack)) {
      const error = { name: nameError, stack: stackError, resource } = err

      /** STATUS: 3xx */
      if (nameError.localeCompare(NO_MODIFICATION_ERROR) === 0)
        return res.status(304).json({ message: "Aucune modification apporter" })

      /** STATUS: 4xx */
      if (
        (err instanceof ValidationError || err instanceof UniqueConstraintError) ||
        nameError.localeCompare(ALREADY_EXIST_ERROR) === 0
      ) {
        if (resource) return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400, resource) });
        else return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });
      }

      if (nameError.localeCompare(NO_CRITRIA_ERROR) === 0)
        return res.status(400).json({ message: "No criteria selected" })

      if (
        nameError.localeCompare(ANONYMOUS_USER_ERROR) === 0 ||
        nameError.localeCompare(MALFORMED_TOKEN_ERROR) === 0
      )
        return res.status(401).json({ message: ErrorMessage.getMessageByStatusCode(401) })

      if (nameError.localeCompare(EXPIRED_TOKEN_ERROR) === 0)
        return res.status(401).json({ message: ErrorMessage.getMessageByStatusCode(401, { expiredToken: true }) })

      if (nameError.localeCompare(IS_LOGIN_ERROR) === 0)
        return res.status(401).json({ message: ErrorMessage.getMessageByStatusCode(401, { isLogIn: true }) })

      if (
        nameError.localeCompare(EMPTY_ERROR) === 0 ||
        nameError.localeCompare(NOT_EXIST_ERROR) === 0 ||
        nameError.localeCompare(NO_ENTITY_SELECTED_ERROR) === 0
      )
        return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

      /** STATUS: 5xx */
      if (new RegExp(`^${REFERENCE_ERROR}`).test(stackError))
        return res.status(500).json({ name: 'InternalError' })

    }
  }
}



