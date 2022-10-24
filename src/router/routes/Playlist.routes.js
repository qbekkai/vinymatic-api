const { Playlist, User, Audio, sequelize } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const includeEntity = require('../relations/includeEntity')
const { haveYouThePermission } = require('../../auth/accessControl')
const Tools = require('../../tools/tools')

module.exports = (router) => {
  router.route('/playlists')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          // const playlists = await Playlist.findAll(includeEntity.routes.playlist.gets)
          const options = {
            attributes: ["id", "title", "duration", "image", "playlistUrl", "resourceUrl"],
            include: [
              { model: User, as: "Owner", attributes: ["id", "username", "showName", "email", "phoneNumber", "profilImage", "role"] },
            ]
          }
          const playlistsFound = await Playlist.findAll(options)
          res.status(200).json({ playlists: playlistsFound })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/playlists/search')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req
          const { withCol = null } = query
          if (!withCol || (withCol && (!withCol.field || !withCol.value))) throw { name: 'VinymatiApiNoCriteriaError' }

          const withColObject = Tools.getWithColAsArray(withCol)
          const whereClause = withColObject.map(({ field, value }) => Tools.autocomplete(field, value))

          const options = {
            attributes: ["id", "title", "duration", "image", "playlistUrl", "resourceUrl"],
            // attributes: ["id", "title", "duration", "image", [sequelize.fn('COUNT', sequelize.col('Audio.id')), 'nbAudio']],
            include: [
              { model: User, as: "Owner", ...includeEntity.routes.user.gets },
              // { model: Audio, attributes: ["id", "title", "duration", "image"], through: { attributes: ["position"] } }
            ]
          }
          options.where = whereClause

          const playlistFound = await Playlist.findAll(options)

          res.status(200).json({ playlist: playlistFound })
        } catch (err) {
          if (err.name.localeCompare(NO_CRITRIA_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })



  /** ITEMS OPPERATION */
  router.route('/playlist/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: ["id", "title", "description", "duration", "image", "playlistUrl", "resourceUrl", [sequelize.fn('COUNT', sequelize.col('PlaylistLikes.id')), 'like']],
            // attributes: ["id", "title", "description", "duration", "image", "playlistUrl", "resourceUrl"],
            include: [
              // { model: User, as: "Owner", attributes: ["id", "username", "showName", "email", "phoneNumber", "profilImage", "role"] },
              {
                model: Audio,
                attributes: ["id", "title", "image", "duration", "audioUrl", "resourceUrl"],
                include: [
                  { model: Vinyl, attributes: ["id", "idRelease", "title"] },
                  { model: Artist, as: "AudioMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"] }
                ],
                through: { attributes: ["position"] }
              },
              { model: User, as: "PlaylistLikes", attributes: ["id", "username", "showName", "email", "phoneNumber", "profilImage", "role"], through: { attributes: [] } },
            ],
            group: ['PlaylistLikes.id', 'Audios.id'],
            rejectOnEmpty: true
          }
          const playlistFound = await Playlist.findByPk(id, options)
          req.results = { playlist: playlistFound }

          next()
        } catch (err) {
          if (/SequelizeEmptyResultError/.test(err.name))
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  router.route('/playlist/:id/likes')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const playlistFound = await Playlist.findByPk(id, {
            attributes: ["id", "title", "duration", "image", "playlistUrl", "resourceUrl"],
            include: [
              { model: User, as: "PlaylistLikes", attributes: ["id", "username", "showName", "email", "phoneNumber", "profilImage", "role"], through: { attributes: [] } },
            ], rejectOnEmpty: true
          })
          res.status(200).json({ playlist: playlistFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}
