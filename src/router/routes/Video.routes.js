const { URL_API, PORT_API, TOKEN_API } = process.env

const FormData = require('form-data')
const fs = require('fs')

const { ValidationError, UniqueConstraintError, QueryTypes } = require('sequelize')
const { Video, User, Artist, sequelize } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, NO_MODIFICATION_ERROR } = require('../../error/constError')
const { haveYouThePermission } = require('../../auth/accessControl')
const VideoService = require('../../services/videoService')
const ApiService = require('../../services/apiService')
const imageTools = require('../../tools/images.tool')
const Tools = require('../../tools/tools')


const BucketS3Service = require('../../files/s3')
const multer = require('multer')
const upload = multer({ dest: './src/files/uploads' })

module.exports = (router) => {
  router.route('/videos')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req;
          // const pagination = Tools.pagination(query);
          const options = {
            attributes: { exclude: ["description", "ArtistId", "UserId"] },
            include: [
              { model: User, attributes: ["id", "username"] },
              { model: Artist, attributes: ["id", "name"] }
            ]
          }
          const videosFound = await Video.findAll(options)
          res.status(200).json({ videos: videosFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createAny', 'video'),
      upload.fields([{ name: 'videoFile' }, { name: 'image' }]),
      async (req, res, next) => {
        try {
          const { body: video, files, query } = req
          const { videoFrom = "video", idArtist, idUser } = query
          const videoCreated = await Video.create(video)

          let found
          if (idArtist && !idUser) found = await Artist.findByPk(idArtist, { rejectOnEmpty: true })
          if (!idArtist && idUser) found = await User.findByPk(idUser, { rejectOnEmpty: true })
          if (idArtist && idUser) throw { name: 'VinymaticApiNotArtistAndUserInSameTime' }
          if (idArtist || idUser) await found.addVideo(videoCreated)

          if (files && files.videoFile) {
            const vs = new VideoService(files.videoFile)
            const videoUploaded = await vs.uploadAVideoFile({ videoFrom, itemDb: videoCreated, itemAd: video })
            await videoCreated.update(videoUploaded.video)
          }

          if (files && files.image) {
            const options = imageTools.getOptionForuploadImageFile(files.image, 'video', videoCreated, video)
            const videoImage = await imageTools.uploadImageFile(options)
            await videoCreated.update(videoImage)
          }

          const options = {
            attributes: { exclude: ["ArtistId", "UserId"] },
            include: [
              { model: User, attributes: ["id", "username"] },
              { model: Artist, attributes: ["id", "name"] }
            ],
            rejectOnEmpty: true
          }

          const videoFound = await Video.findByPk(videoCreated.id, options)
          res.status(200).json({ video: videoFound })
        } catch (err) {
          if (err.name.localeCompare('VinymaticApiNotArtistAndUserInSameTime') === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/video/search')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req
          const { title = null, artist = null, user = null } = query

          let whereClause = 'WHERE'
          if (!title && !artist && !user) throw { name: 'VinymatiApiNoCriteriaError' }
          if (!title && !artist && user) whereClause = `${whereClause} u.username LIKE '%${user}%'`
          if (!title && artist && !user) whereClause = `${whereClause} a.name LIKE '%${artist}%'`
          if (!title && artist && user) whereClause = `${whereClause} a.name LIKE '%${artist}%' OR u.username LIKE '%${user}%'`
          if (title && !artist && !user) whereClause = `${whereClause} v.title LIKE '%${title}%'`
          if (title && !artist && user) whereClause = `${whereClause} v.title LIKE '%${title}%' OR u.username LIKE '%${user}%'`
          if (title && artist && !user) whereClause = `${whereClause} v.title LIKE '%${title}%' OR a.name LIKE '%${artist}%'`
          if (title && artist && user) whereClause = `${whereClause} v.title LIKE '%${title}%' OR a.name LIKE '%${artist}%' OR u.username LIKE '%${user}%'`

          let videosFound = await sequelize.query(`
            SELECT
              v.id AS videoId,
              v.title AS videoTitle,
              v.description AS videoDescription,
              v.image AS videoImage,
              v.videoUrl AS videoVideoUrl,
              u.id AS userId,
              u.username AS userUsername,
              a.id AS artistId,
              a.name AS artistName
            FROM Videos AS v 
            LEFT OUTER JOIN Users AS u ON v.UserId = u.id 
            LEFT OUTER JOIN Artists AS a ON v.ArtistId = a.id
            ${whereClause};`,
            { model: Video, type: QueryTypes.SELECT }
          )

          videosFound = videosFound.map(video => {
            const newVideo = {}
            const oldVideo = video
            const {
              videoId,
              videoTitle,
              videoDescription,
              videoImage,
              videoVideoUrl,
              userId,
              userUsername,
              artistId,
              artistName
            } = oldVideo.dataValues

            newVideo.id = videoId
            newVideo.title = videoTitle
            newVideo.description = videoDescription
            newVideo.image = videoImage
            newVideo.videoUrl = videoVideoUrl

            if (userId) {
              newVideo.User = {}
              newVideo.User.id = userId
              newVideo.User.username = userUsername
            } else newVideo.User = null

            if (artistId) {
              newVideo.Artist = {}
              newVideo.Artist.id = artistId
              newVideo.Artist.name = artistName
            } else newVideo.Artist = null

            oldVideo.dataValues = newVideo
            return oldVideo
          })

          res.status(200).json({ videos: videosFound })
        } catch (err) {
          // if (err.name.localeCompare(NO_CRITRIA_ERROR) === 0)
          //   return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });


          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
  /** ITEMS OPPERATION */
  router.route('/video/:id')
    .get(
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params
          const options = {}
          const video = await Video.findByPk(id, { ...options, rejectOnEmpty: true })
          res.status(200).json({ video })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      haveYouThePermission('updateAny', 'video'),
      upload.fields([{ name: 'videoFile' }, { name: 'image' }]),
      async (req, res, next) => {
        try {
          const { body: video, files, query, params } = req
          const { videoFrom = "video", idArtist, idUser } = query
          const { id } = params

          let videoFound = await Video.findByPk(id, { rejectOnEmpty: true })

          let found
          if (idArtist || idUser) {
            found = await Artist.findByPk(idArtist ?? videoFound.ArtistId, { rejectOnEmpty: true })
            if (found) await found.removeVideo(videoFound)
            found = await User.findByPk(idUser ?? videoFound.UserId, { rejectOnEmpty: true })
            if (found) await found.removeVideo(videoFound)
          }

          if (idArtist && !idUser) found = await Artist.findByPk(idArtist, { rejectOnEmpty: true })
          if (!idArtist && idUser) found = await User.findByPk(idUser, { rejectOnEmpty: true })
          if (idArtist && idUser) throw { name: 'VinymaticApiNotArtistAndUserInSameTime' }

          if (idArtist || idUser) await found.addVideo(videoFound)

          if (files && files.videoFile) {
            const vs = new VideoService(files.videoFile)
            const videoUploaded = await vs.uploadAVideoFile({ videoFrom, itemDb: videoFound, itemAd: video })
            await videoFound.update(videoUploaded.video)
          }

          if (files && files.image) {
            const options = imageTools.getOptionForuploadImageFile(files.image, 'video', videoFound, video)
            const videoImage = await imageTools.uploadImageFile(options)
            await videoFound.update(videoImage)
          }

          const options = {
            attributes: { exclude: ["ArtistId", "UserId"] },
            include: [
              { model: User, attributes: ["id", "username"] },
              { model: Artist, attributes: ["id", "name"] }
            ],
            rejectOnEmpty: true
          }

          await Video.update(video, { where: { id } })

          videoFound = await Video.findByPk(id, options)
          res.status(200).json({ video: videoFound })
        } catch (err) {
          if (err.name.localeCompare(NO_MODIFICATION_ERROR) === 0)
            return res.status(304).json({ message: "Aucune modification apporter" })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteAny', 'video'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params
          const videoFound = await Video.findByPk(id, { rejectOnEmpty: true })

          if (videoFound.videoUrl) {
            const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
            await as.doRequest('DELETE', videoFound.videoUrl)
          }

          let found
          if (videoFound.idArtist || videoFound.idUser) {
            found = await Artist.findByPk(videoFound.ArtistId)
            if (found) await found.removeVideo(videoFound)
            found = await User.findByPk(videoFound.UserId)
            if (found) await found.removeVideo(videoFound)
          }


          await Video.destroy({ where: { id } })
          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/video/:typeVideo/:key')
    .get(
      async (req, res, next) => {
        try {
          const { params } = req
          const { typeVideo, key } = params

          const path = `${typeVideo}`
          const bucketS3Service = new BucketS3Service('video')
          const getResult = await bucketS3Service.getFile(`${path}/${key}`)

          getResult.pipe(res)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      async (req, res, next) => {
        try {
          const { params } = req
          const { typeVideo, key } = params

          const path = `${typeVideo}/${key}`
          const bucketS3Service = new BucketS3Service('video')
          await bucketS3Service.deleteFile(path)
          console.log("deleted from s3")

          res.status(204).json({})
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}


