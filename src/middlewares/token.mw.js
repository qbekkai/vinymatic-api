const { User } = require('./../db/models')
const { EMPTY_ERROR, ANONYMOUS_USER_ERROR } = require('./../error/constError')
const ErrorMessage = require('../error/messages')



module.exports = {
  getUserFromToken: async (req, res, next) => {
    try {
      const { user, originalUrl } = req
      const { username } = user

      if (!username) throw { name: "VinymatiApiAnonymousUser" }

      const { entity } = originalUrl.match(/^\/own\/(?<entity>\w+)/).groups
      if (/user/.test(entity)) return next();

      const options = {
        attributes: ["id", "username", "email", "phoneNumber", "profilImage", "role"],
        where: { username },
        rejectOnEmpty: true
      }

      const userFound = await User.findOne(options)
      req.user = userFound
      next()
    } catch (err) {
      if (err.name.localeCompare(ANONYMOUS_USER_ERROR) === 0)
        return res.status(401).json({ message: ErrorMessage.getMessageByStatusCode(401) })

      if (err.name.localeCompare(EMPTY_ERROR) === 0)
        return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
    }

  }
}