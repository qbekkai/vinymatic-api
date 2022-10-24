const { sequelize, Playlist, User, Audio } = require('./../../../db/models')
const ErrorMessage = require('../../../error/messages')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../../error/constError')
const includeEntity = require('../../relations/includeEntity')
const { haveYouThePermission } = require('../../../auth/accessControl')
const tools = require('./../../../tools/tools')

const multer = require('multer')
const upload = multer({ dest: './src/files/uploads' })
const imageTools = require('../../../tools/images.tool')

module.exports = (router) => {
  router.route('/own/playlists')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { user, query } = req
          const { page = null, limit = null } = query

          const pagination = tools.pagination({ page, limit })
          /** TODO : COUNT nbAudio in playlist */
          const options = {
            attributes: ["id", "title", "duration", "image", "playlistUrl", "resourceUrl",],
            // attributes: ["id", "title", "duration", "image", "playlistUrl", "resourceUrl", [sequelize.fn("COUNT", sequelize.col("Audios->AudiosInPlaylist.AudioId")), "nbAudios"], [sequelize.fn("COUNT", sequelize.col("PlaylistLike->Likes.UserId")), "nbLikes"]],
            include: [
              { model: Audio, attributes: [] },
              { model: User, as: "PlaylistLikes", attributes: ["showName"] },
            ],
            // group: ["Playlist.id", "Audios->AudiosInPlaylist.AudioId", "PlaylistLike->Likes.UserId"],
            ...pagination
          }
          const playlistsFound = await user.getPlaylists(options)
          res.status(200).json({ own: user, playlists: playlistsFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createOwn', 'playlist'),
      upload.fields([{ name: 'image' }]),
      async (req, res, next) => {
        try {
          const { body: playlist, user, files } = req;

          const playlistCreated = await user.createPlaylist({ ...playlist, duration: 0 })

          if (files) {
            if (files.image) {
              const options = imageTools.getOptionForuploadImageFile(files.image, 'playlist', playlistCreated, playlist)
              const playlistImage = await imageTools.uploadImageFile(options)
              await playlistCreated.update(playlistImage)
            }
          }

          const options = { attributes: ["id", "title", "duration"], where: { id: playlistCreated.id }, rejectOnEmpty: true }
          const playlistGetted = (await user.getPlaylists(options))[0]
          res.status(201).json({ own: user, playlist: playlistGetted })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/own/playlist/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params, user } = req
          const { id } = params

          const options = {
            attributes: ["id", "title", "description", "image", "duration", "playlistUrl", "resourceUrl", [sequelize.literal(`(SELECT count(a.id) FROM Audios AS a INNER JOIN AudiosInPlaylists AS aip ON a.id = aip.AudioId INNER JOIN Playlists AS p ON aip.PlaylistId = p.id WHERE p.id = ${id})`), "nbAudios"], [sequelize.literal(`(SELECT count(u.id) FROM Users AS u INNER JOIN PlaylistLikes AS pl ON u.id = pl.UserId INNER JOIN Playlists AS p ON pl.PlaylistId = p.id WHERE p.id = ${id})`), "nbLikes"]],
            include: [
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
            group: ["Playlist.id", "Audios->AudiosInPlaylist.AudioId", "PlaylistLikes->PlaylistLike.UserId"],
            where: { id },
            rejectOnEmpty: true
          }

          const playlistFound = (await user.getPlaylists(options))[0]
          req.results = { own: user, playlist: playlistFound }

          next()
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      haveYouThePermission('updateOwn', 'playlist'),
      upload.fields([{ name: 'image' }]),
      async (req, res, next) => {
        try {
          const { params, body: playlist, user, files } = req
          const { id } = params
          const options = { attributes: ["id", "title", "duration"], where: { id }, rejectOnEmpty: true }

          let playlistGetted = (await user.getPlaylists(options))[0]
          await Playlist.update(playlist, { where: { id: playlistGetted.id } })
          playlistGetted = (await user.getPlaylists(options))[0]

          if (files) {
            if (files.image) {
              const options = imageTools.getOptionForuploadImageFile(files.image, 'playlist', playlistGetted, playlist)
              const playlistImage = await imageTools.uploadImageFile(options)
              await playlistGetted.update(playlistImage)
            }
          }

          playlistGetted = (await user.getPlaylists(options))[0]
          res.status(200).json({ own: user, playlist: playlistGetted })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteOwn', 'playlist'),
      async (req, res, next) => {
        try {
          const { params, user } = req
          const { id } = params
          const options = { where: { id }, rejectOnEmpty: true }

          let playlistGetted = (await user.getPlaylists(options))[0]
          if (!playlistGetted) return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          await Playlist.destroy({ where: { id: playlistGetted.id } })
          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/playlist/:id/likes')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params, user } = req
          const { id } = params

          const options = {
            attributes: ["id", "title", "image", "duration", "playlistUrl", "resourceUrl", [sequelize.fn("COUNT", sequelize.col("PlaylistLikes->PlaylistLike.UserId")), "nbLikes"]],
            include: [
              { model: User, as: "PlaylistLikes", attributes: ["id", "username", "showName", "email", "phoneNumber", "profilImage", "role"], through: { attributes: [] } },
            ],
            group: ["Playlist.id", "PlaylistLikes->PlaylistLike.UserId"],
            where: { id },
            rejectOnEmpty: true
          }
          /** TODO: TEST [0] */
          const playlistFound = (await user.getPlaylists(options))[0]
          res.status(200).json({ own: user, playlist: playlistFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/playlist/:idPlaylist/audio/:idAudio')
    .post(
      haveYouThePermission('createOwn', 'playlist:audio'),
      async (req, res, next) => {
        try {
          const { params, user } = req
          const { idAudio, idPlaylist } = params

          const playlistFound = (await user.getPlaylists({ attributes: ["id", "duration"], include: [{ model: Audio }], where: { id: idPlaylist }, rejectOnEmpty: true }))[0]
          const audioFound = await Audio.findByPk(idAudio, { attributes: ["id", "duration"], rejectOnEmpty: true })

          const audioInPlaylistAdded = await playlistFound.addAudio(audioFound, { through: { position: (playlistFound.Audios.length + 1) }, rejectOnEmpty: true })
          if (audioInPlaylistAdded) {
            // if (audioInPlaylistAdded && audioInPlaylistAdded[0] instanceof AudiosInPlaylist) {
            let playlistDuration = playlistFound.duration
            let audioDuration = /^\d+$/.test(audioFound.duration) ? +(audioFound.duration) : audioFound.duration;
            playlistDuration = playlistDuration + audioDuration
            await Playlist.update({ duration: playlistDuration }, { where: { id: idPlaylist } })
          } else throw { name: "VinymatiApiAlreadyExist" }

          res.status(201).json({ message: ErrorMessage.getMessageByStatusCode(201) })
        } catch (err) {
          if (err.name.localeCompare(ALREADY_EXIST_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteOwn', 'playlist:audio'),
      async (req, res, next) => {
        try {
          const { params, user } = req
          const { idPlaylist, idAudio } = params

          const playlistFound = (await user.getPlaylists({ attributes: ["id", "duration"], include: [{ model: Audio }], where: { id: idPlaylist }, rejectOnEmpty: true }))[0]
          const audioFound = await Audio.findByPk(idAudio, { rejectOnEmpty: true })

          let playlistDuration = playlistFound.duration
          let audioDuration = /^\d+$/.test(audioFound.duration) ? +(audioFound.duration) : audioFound.duration;
          playlistDuration = playlistDuration - audioDuration
          await Playlist.update({ duration: playlistDuration }, { where: { id: idPlaylist }, rejectOnEmpty: true })

          const audiosInPlaylistOld = await playlistFound.getAudios()
          let audiosInPlaylist = audiosInPlaylistOld.sort((a, b) => { return (a.AudiosInPlaylist.position - b.AudiosInPlaylist.position) })
          const indextAudioToRemove = audiosInPlaylist.findIndex(a => a.id === audioFound.id)
          if (indextAudioToRemove === -1) throw { name: "VinymatiApiNotExist" }

          let [notToChange, toRemove, toChange] = [
            audiosInPlaylist.slice(0, indextAudioToRemove),
            audiosInPlaylist.slice(indextAudioToRemove, indextAudioToRemove + 1),
            audiosInPlaylist.slice(indextAudioToRemove + 1, audiosInPlaylist.length)
          ]
          toChange = toChange.map(audio => {
            const audioChanged = audio
            audioChanged.AudiosInPlaylist.position = audioChanged.AudiosInPlaylist.position - 1;
            return audioChanged
          })

          audiosInPlaylist = notToChange.concat(toChange)
          await playlistFound.removeAudios(audiosInPlaylistOld)
          for (const audio of audiosInPlaylist) {
            await playlistFound.addAudio(audio, { through: { position: audio.AudiosInPlaylist.position } })
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

  /** TODO: middleware pour uniformormiser les reponse */
  router.route('/own/playlist/:idPlaylist/audio/:idAudio/position')
    .patch(
      haveYouThePermission('updateOwn', 'playlist:audio:position'),
      async (req, res, next) => {
        try {
          const { params, query, user } = req
          const { idPlaylist, idAudio } = params
          let { to } = query
          to = to - 1

          const audioFound = await Audio.findByPk(idAudio, { rejectOnEmpty: true })
          const playlistFound = (await user.getPlaylists({ attributes: ["id"], include: [{ model: Audio }], where: { id: idPlaylist }, rejectOnEmpty: true }))[0]

          const audiosInPlaylistOld = await playlistFound.getAudios()
          let audiosInPlaylist = audiosInPlaylistOld.sort((a, b) => { return (a.AudiosInPlaylist.position - b.AudiosInPlaylist.position) })
          const indextAudioToMove = audiosInPlaylist.findIndex(a => a.id === audioFound.id)
          if (indextAudioToMove === -1) throw { name: "VinymatiApiNotExist" }

          if (indextAudioToMove > to) {
            let [notToChangeBefore, toChange, toMove, notToChangeAfter] = [
              audiosInPlaylist.slice(0, to),
              audiosInPlaylist.slice(to, indextAudioToMove),
              audiosInPlaylist.slice(indextAudioToMove, indextAudioToMove + 1),
              audiosInPlaylist.slice(indextAudioToMove + 1, audiosInPlaylist.length)
            ]
            toChange = toChange.map(audio => {
              const audioChanged = audio
              audioChanged.AudiosInPlaylist.position = audioChanged.AudiosInPlaylist.position + 1;
              return audioChanged
            })
            toMove = toMove.map(audio => {
              const audioMoved = audio
              audioMoved.AudiosInPlaylist.position = audioMoved.AudiosInPlaylist.position - toChange.length;
              return audioMoved
            })
            audiosInPlaylist = toMove.concat(toChange)

            audiosInPlaylist = notToChangeBefore.concat(audiosInPlaylist)
            audiosInPlaylist = audiosInPlaylist.concat(notToChangeAfter)

          } else {
            let [notToChangeBefore, toMove, toChange, notToChangeAfter] = [
              audiosInPlaylist.slice(0, indextAudioToMove),
              audiosInPlaylist.slice(indextAudioToMove, indextAudioToMove + 1),
              audiosInPlaylist.slice(indextAudioToMove + 1, to + 1),
              audiosInPlaylist.slice(to + 1, audiosInPlaylist.length)
            ]
            toChange = toChange.map(audio => {
              const audioChanged = audio
              audioChanged.AudiosInPlaylist.position = audioChanged.AudiosInPlaylist.position - 1;
              return audioChanged
            })
            toMove = toMove.map(audio => {
              const audioMoved = audio
              audioMoved.AudiosInPlaylist.position = audioMoved.AudiosInPlaylist.position + toChange.length;
              return audioMoved
            })
            audiosInPlaylist = toChange.concat(toMove)

            audiosInPlaylist = notToChangeBefore.concat(audiosInPlaylist)
            audiosInPlaylist = audiosInPlaylist.concat(notToChangeAfter)
          }

          await playlistFound.removeAudios(audiosInPlaylistOld)
          for (const audio of audiosInPlaylist) {
            await playlistFound.addAudio(audio, { through: { position: audio.AudiosInPlaylist.position } })
          }

          res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200) })
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