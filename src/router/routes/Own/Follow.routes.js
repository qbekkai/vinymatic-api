const { Label, User, sequelize } = require('./../../../db/models')
const ErrorMessage = require('../../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../../error/constError')
const { haveYouThePermission } = require('../../../auth/accessControl')
const tools = require('./../../../tools/tools')

module.exports = (router) => {
  /** FOLLOWER FEATURE */
  router.route('/own/followings')
    .get(
      haveYouThePermission('readOwn', 'user'),
      async (req, res, next) => {
        try {

          const { user, query } = req
          const { counting, isArtist, isLabel, page = null, limit = null } = query

          const isArtistBoolean = isArtist ? tools.isBooleanFromString(isArtist) : null
          const isLabelBoolean = isLabel ? tools.isBooleanFromString(isLabel) : null
          const coutingBoolean = counting ? tools.isBooleanFromString(counting) : null
          const pagination = tools.pagination({ page, limit })

          if (isArtistBoolean) {
            const options = {
              attributes: ["id", "fullName", "thumbnail"],
              through: { attributes: [] },
              ...pagination
            }

            let artists = null
            if (coutingBoolean) {
              artists = await user.countArtists(options)
              return res.status(200).json({ own: user, ArtistsFollowingCount: artists })
            } else {
              artists = await user.getArtists(options)
              artists.map(a => delete a.dataValues.ArtistFollowers)
              return res.status(200).json({ own: user, ArtistsFollowing: artists })
            }
          } else if (isLabelBoolean) {
            const options = {
              attributes: ["id", "name", "thumbnail"],
              through: { attributes: [] },
              ...pagination
            }

            let labels = null
            if (coutingBoolean) {
              labels = await user.countLabels(options)
              return res.status(200).json({ own: user, LabelsFollowingCount: labels })
            } else {
              labels = await user.getLabels(options)
              labels.map(a => delete a.dataValues.LabelsFollowers)
              return res.status(200).json({ own: user, LabelsFollowing: labels })
            }
          } else {
            const options = {
              attributes: ["id", "username", "showName", "email", "phoneNumber", "profilImage", "role"],
              through: { attributes: [] },
              ...pagination
            }
            let followings = null
            if (coutingBoolean) {
              followings = await user.countFollowings(options)
              return res.status(200).json({ own: user, FollowingCount: followings })
            } else {
              followings = await user.getFollowings(options)
              return res.status(200).json({ own: user, Following: followings })
            }
          }

        } catch (err) {
          if (err.name.localeCompare('VinymaticApiInvalidType') === 0)
            return res.status(400).json({ message: 'VinymaticApiInvalidType' })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/followers')
    .get(
      haveYouThePermission('readOwn', 'user'),
      async (req, res, next) => {
        try {
          const { user, query } = req
          const { page = null, limit = null } = query

          const pagination = tools.pagination({ page, limit })

          const options = {
            attributes: ["id", "username", "showName", "email", "showName", "phoneNumber", "profilImage", "role"],
            through: { attributes: [] },
            ...pagination
          }
          const followers = await user.getFollowers(options)

          return res.status(200).json({ own: user, Followers: followers })
        } catch (err) {

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/give/follow')
    .post(
      haveYouThePermission('createOwn', 'user:follow'),
      async (req, res, next) => {
        try {
          const { query, user } = req
          const { toFollow: id, isArtist } = query
          const { username } = user

          const _selfUser = await User.findOne({ attributes: ["id"], where: { username }, rejectOnEmpty: true })
          if (isArtist === 'true') {
            const artistActingFound = await Artist.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })
            await _selfUser.addArtist(artistActingFound)
          } else if (isLabel === 'true') {
            const labelActingFound = await Label.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })
            await _selfUser.addLabel(labelActingFound)
          } else if ((isArtist === 'false' || !isArtist) && (isLabel === 'false' || !isLabel)) {
            const userActingFound = await User.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })
            await _selfUser.addFollowing(userActingFound)
          }

          res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200) })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/give/unfollow')
    .delete(
      haveYouThePermission('deleteOwn', 'user:follow'),
      async (req, res, next) => {
        try {
          const { query, user } = req
          const { userToUnfollow: id, isArtist } = query
          const { username } = user

          const _selfUser = await User.findOne({ attributes: ["id"], where: { username }, rejectOnEmpty: true })

          if (isArtist === 'true') {
            const artistActingFound = await Artist.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })
            await _selfUser.removeArtist(artistActingFound)
          } else if (isLabel === 'true') {
            const labelActingFound = await Label.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })
            await _selfUser.removeLabel(labelActingFound)
          } else if (isArtist === 'false' || !isArtist) {
            const userActingFound = await User.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })
            await _selfUser.removeFollowing(userActingFound)
          }

          res.status(204).json({})
        } catch (err) {
          if (
            err.name.localeCompare(EMPTY_ERROR) === 0 ||
            err.name.localeCompare(NO_ENTITY_SELECTED_ERROR) === 0
          )
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/delete/follower')
    .delete(
      haveYouThePermission('deleteOwn', 'user:follow'),
      async (req, res, next) => {
        try {
          const { query, user } = req
          const { userToDeleteFollower: id } = query
          const { username } = user

          const _selfUser = await User.findOne({ attributes: ["id"], where: { username }, rejectOnEmpty: true })
          const userActingFound = await User.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })

          const userUnfollowed = await _selfUser.removeFollower(userActingFound)
          if (userUnfollowed === 0) throw { name: "VinymatiApiNotExist" }


          res.status(204).json({})
        } catch (err) {
          if (
            err.name.localeCompare(EMPTY_ERROR) === 0 ||
            err.name.localeCompare(NO_ENTITY_SELECTED_ERROR) === 0
          )
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

}