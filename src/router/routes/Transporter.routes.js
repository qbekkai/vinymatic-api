const { URL_API, PORT_API, TOKEN_API } = process.env

const FormData = require('form-data')
const fs = require('fs')

const { ValidationError, UniqueConstraintError, QueryTypes } = require('sequelize')
const { Transporter, sequelize } = require('./../../db/models')
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
  router.route('/transporters')
    .get(
      // haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req;
          const pagination = Tools.pagination(query);
          const options = {
            ...pagination
          }
          const transportersFound = await Transporter.findAll(options)
          res.status(200).json({ transporters: transportersFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      // haveYouThePermission('createOwn', 'playlist'),
      upload.fields([{ name: 'image' }]),
      async (req, res, next) => {
        try {
          const { body: transporter, files } = req;

          const transporterCreated = await Transporter.create(transporter)

          if (files) {
            if (files.image) {
              const options = imageTools.getOptionForuploadImageFile(files.image, 'transporter', transporterCreated, transporter)
              const transporterImage = await imageTools.uploadImageFile(options)
              await transporterCreated.update(transporterImage)
            }
          }

          const transporterGetted = await Transporter.findOne({ where: { id: transporterCreated.id } })
          res.status(201).json({ transporter: transporterGetted })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  /** ITEMS OPPERATION */
  router.route('/transporter/:id')
    .patch(
      // haveYouThePermission('createOwn', 'playlist'),
      upload.fields([{ name: 'image' }]),
      async (req, res, next) => {
        try {
          const { body: transporter, files, params: { id } } = req;

          let transporterFound = await Transporter.findByPk(id, { rejectOnEmpty: true })

          if (files) {
            if (files.image) {
              const options = imageTools.getOptionForuploadImageFile(files.image, 'transporter', transporterFound, transporter)
              const transporterImage = await imageTools.uploadImageFile(options)
              await transporterFound.update(transporterImage)
            }
          }

          await transporterFound.update(transporter)
          transporterFound = await Transporter.findByPk(transporterFound.id)
          res.status(200).json({ transporter: transporterFound })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
  /* router.route('/video/:id')
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
   */  /* .patch(
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
}) */
  /* .delete(
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
    }) */
}


