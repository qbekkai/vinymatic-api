const { URL_API, PORT_API, TOKEN_API } = process.env
const fs = require('fs')
const getMP3Duration = require('get-mp3-duration')
const FormData = require('form-data');
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const multer = require('multer')
const { ValidationError, UniqueConstraintError } = require('sequelize')

const { Audio, Playlist, AudiosInPlaylist } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const { haveYouThePermission } = require('../../auth/accessControl')
const BucketS3Service = require('../../files/s3')
const { routes: optionsForRes, minimumOfData } = require('../relations/includeEntity')
const Tools = require('./../../tools/tools')
const timeTool = require('./../../tools/time.tool')
const ApiService = require('../../services/apiService');


const upload = multer({ dest: './src/files/uploads' })

module.exports = (router) => {
  router.route('/audios')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req;
          const pagination = Tools.pagination(query);
          const options = {
            ...pagination,
            attributes: ["id", "title", "image", "duration", "audioUrl", "resourceUrl"]
          }
          const audios = await Audio.findAll(options)
          res.status(200).json({ audios })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/audio/:id')
    .get(
      async (req, res, next) => {
        try {
          const { id } = req.params
          const audio = await Audio.findByPk(id, { ...optionsForRes.audio.get, rejectOnEmpty: true })
          req.results = { audio }
          next()
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      haveYouThePermission('updateAny', 'all'),
      upload.fields([{ name: 'songFile' }, { name: 'imageFile' }]),
      async (req, res, next) => {
        try {
          let audioUrlToBody
          const { query, body, params, files } = req
          const { songFile: songFileBody, imageFile: imageFileBody } = body
          const { id } = params
          const { typeAudio } = query

          await Audio.findByPk(id, { attributes: ["id"], rejectOnEmpty: true });

          if (files && !files.songFile && songFileBody === '') {
            const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })

            audioUrlToBody = await as.doRequest('PATCH', `/song/${id}`)
          } else if ((files.songFile && !songFileBody) || (files.songFile && songFileBody)) {
            const songFile = files.songFile.shift()
            const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })

            /** ADD AUDIO */
            let fd = new FormData()
            fd.append('songFile', fs.createReadStream(songFile.path))
            fd.append('typeAudio', typeAudio)
            audioUrlToBody = await as.doRequest('PATCH', `/song/${id}`, fd)
          }

          body.audioUrl = audioUrlToBody.data.audio.audioUrl
          const toUpdate = await Audio.update(body, { where: { id: id } })
          if (toUpdate == null || toUpdate[0] === 0) throw { name: "VinymaticApiNoModification" }

          const audioUpdated = await Audio.findByPk(id, { rejectOnEmpty: true })
          res.status(200).json({ audio: audioUpdated })
        } catch (err) {
          if (err.name.localeCompare(NO_MODIFICATION_ERROR) === 0)
            return res.status(304).json({ message: "Aucune modification apporter" })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      haveYouThePermission('deleteAny', 'audio'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const audio = await Audio.findByPk(id, { attributes: ["id"], rejectOnEmpty: true })

          const bucketS3Service = new BucketS3Service('audio')

          if (audio.dataValues.audioUrl) await bucketS3Service.deleteFile(audio.dataValues.audioUrl.replace('/song/', '')).then(async (res) => {
            console.log("deleted from s3")
          })

          await Audio.update({ audioUrl: null }, { where: { id } })
          res.status(204).json({})
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  router.route('/song/:id')
    .post(
      haveYouThePermission('createAny', 'audio'),
      upload.single('songFile'),
      async (req, res, next) => {
        try {
          const { params, file, query } = req;
          const { id: idAudio } = params;
          const { typeAudio } = query;
          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })

          const options = { attributes: ["title", "position"] }
          let audioFound = await Audio.findByPk(idAudio, { ...options, rejectOnEmpty: true })
          const { title: titleAudio, position: positionAudio } = audioFound

          // UPLOAD AUDIO IN S3 BUCKET AND SAVE IT ON DB
          const fd = new FormData()
          fd.append('audioFile', fs.createReadStream(file.path))
          fd.append('typeAudio', `${typeAudio}s`)
          fd.append('idAudio', idAudio)
          if (titleAudio) fd.append('titleAudio', titleAudio)
          if (positionAudio) fd.append('positionAudio', positionAudio)
          // fd.append('audioFrom', `${audioFrom}s`)

          const resSong = await as.doRequest('POST', `/audios`, fd)
          const imageUploaded = {
            audioUrl: resSong.data.url
          }

          await Audio.update(imageUploaded, { where: { id: idAudio } })
          audioFound = await Audio.findByPk(idAudio, { attributes: ["id", "title", "audioUrl"], rejectOnEmpty: true })
          res.status(200).json({ audio: audioFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      haveYouThePermission('updateAny', 'all'),
      upload.fields([{ name: 'songFile' }]),
      async (req, res, next) => {
        try {
          let songUploaded = {}
          const { body, params, files } = req;
          const { typeAudio } = body;
          const { id: idAudio } = params;
          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })

          // DELETE AUDIO IN S3 BUCKET IF AUDIO EXIST IN DB
          const options = { attributes: ["title", "audioUrl", "position"] }
          let audioFound = await Audio.findByPk(idAudio, { ...options, rejectOnEmpty: true })
          const titleAudio = audioFound.title
          const audioUrl = audioFound.audioUrl
          const positionAudio = audioFound.position

          if (audioUrl) await as.doRequest('DELETE', audioUrl)


          // UPLOAD AUDIO IN S3 BUCKET AND SAVE IT ON DB
          if (files && files.songFile) {
            const file = files.songFile.shift()
            const fd = new FormData()
            fd.append('audioFile', fs.createReadStream(file.path))
            fd.append('typeAudio', `${typeAudio}s`)
            fd.append('idAudio', idAudio)
            if (titleAudio) fd.append('titleAudio', titleAudio)
            if (positionAudio) fd.append('positionAudio', positionAudio)
            // fd.append('audioFrom', `${audioFrom}s`)

            const resSong = await as.doRequest('POST', `/audios`, fd)
            songUploaded.audioUrl = resSong.data.url
          } else songUploaded.audioUrl = null


          // await Audio.update(songUploaded, { where: { id: idAudio } })
          // audioFound = await Audio.findByPk(idAudio, { attributes: ["id", "title", "audioUrl"], rejectOnEmpty: true })
          res.status(200).json({ audio: { audioUrl: songUploaded.audioUrl } })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  router.route('/song/:typeAudio/:key')
    .get(
      haveYouThePermission('readAny', 'all'),
      // upload.single('song'),
      async (req, res, next) => {
        try {
          const { params: { key, typeAudio }, query: { isGetDuration } } = req
          const [, ext] = key.split(/\./)

          const path = `${typeAudio}/${key}`
          const bucketS3Service = new BucketS3Service('audio')



          const getResult = await bucketS3Service.getFile(path, { isGetDuration })
          if (!isGetDuration || (isGetDuration && isGetDuration === "false")) getResult.pipe(res)
          else return res.status(200).json({
            duration: {
              minutes: timeTool.toMinutes(getMP3Duration(getResult.Body)),
              seconds: timeTool.toSeconds(getMP3Duration(getResult.Body)),
              milliseconds: getMP3Duration(getResult.Body)
            }
          })

        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      async (req, res, next) => {
        try {
          const { params } = req
          const { typeAudio, key } = params

          const path = `${typeAudio}/${key}`
          const bucketS3Service = new BucketS3Service('audio')
          await bucketS3Service.deleteFile(path)
          console.log("deleted from s3")

          res.status(204).json({})
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}


