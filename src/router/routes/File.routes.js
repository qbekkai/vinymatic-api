const multer = require('multer')
const fs = require('fs')
const util = require('util')

const unlinkFile = util.promisify(fs.unlink)
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const { haveYouThePermission } = require('../../auth/accessControl')

const BucketS3Service = require('../../files/s3')
const upload = multer({ dest: './src/files/uploads' })

module.exports = (router) => {
  router.route('/images')
    .post(
      upload.single('image'),
      async (req, res, next) => {
        try {
          const { file, body } = req
          const { typeImage, imageFrom, name, id_, positionImage, username } = body

          let filename;
          if (username)
            filename = `${username}_${Date.now()}D.jpg`;
          else {
            filename = positionImage
              ? `${name}_${id_}I${Date.now()}D${positionImage}P.jpg`
              : `${name}_${id_}I${Date.now()}D.jpg`;
          }

          const path = encodeURI(`${imageFrom}/${typeImage}/${filename}`)

          const bucketS3Service = new BucketS3Service('image')
          const uploadResult = await bucketS3Service.uploadFile(path, file)
          await unlinkFile(file.path)

          const imageUploaded = {
            url: `/image/${uploadResult.Key}`,
          }

          res.status(200).json(imageUploaded)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
  router.route('/audios')
    .post(
      upload.single('audioFile'),
      async (req, res, next) => {
        try {
          const { file, body } = req
          const { typeAudio, idAudio, positionAudio } = body
          let { titleAudio } = body
          titleAudio = titleAudio.replace(/\s/g, '_').replace(/\//g, '-')

          let filename = `${titleAudio}_${idAudio}I${Date.now()}D${positionAudio}P.mp3`

          const path = encodeURI(`${typeAudio}/${filename}`)

          const bucketS3Service = new BucketS3Service('audio')
          const uploadResult = await bucketS3Service.uploadFile(path, file)
          await unlinkFile(file.path)

          const imageUploaded = {
            url: `/song/${uploadResult.Key}`,
          }

          res.status(200).json(imageUploaded)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/files/video')
    .post(
      upload.single('videoFile'),
      async (req, res, next) => {
        try {
          const { file, body } = req
          const { typeVideo, idVideo } = body
          let { title } = body
          title = title.replace(/\s/g, '_').replace(/\//g, '-')

          let filename = `${title}_${idVideo}I${Date.now()}D.mp4`

          const path = encodeURI(`${typeVideo}/${filename}`)

          const bucketS3Service = new BucketS3Service('video')
          const uploadResult = await bucketS3Service.uploadFile(path, file)
          await unlinkFile(file.path)

          const imageUploaded = {
            url: `/video/${uploadResult.Key}`,
          }

          res.status(200).json(imageUploaded)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}


// eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNjM4OTU3NzYxLCJleHAiOjE2NzA0OTM3NjF9.d0KrMFHmNRtn-coqUG-oKPFyJspIm1zVFhk6_0Jyf-c