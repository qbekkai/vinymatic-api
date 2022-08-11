const jwt = require('jsonwebtoken')
const privateKey = require('../auth/privateKey').privateKey
const ErrorMessage = require('../error/messages')



module.exports = (req, res, next) => {
  const authorizationHeader = req.headers.authorization
  if (!authorizationHeader) {
    req.user = { role: 'anonymous' }
    return next();
  }
  const [, token] = authorizationHeader.split(' ')
  const decodedToken = jwt.verify(token, privateKey, (error, decodedToken) => {
    if (error) {
      let returnedJsonError = {};
      switch (true) {
        case /jwt expired/i.test(error.message):
          returnedJsonError.message = ErrorMessage.getMessageByStatusCode(401, { expiredToken: true });
          break;
        default:
          returnedJsonError.message = ErrorMessage.getMessageByStatusCode(401, { isLogIn: true });
          returnedJsonError.data = error
          break;
      }
      return res.status(401).json(returnedJsonError)
    }
    req.user = decodedToken
    next()
  })
}