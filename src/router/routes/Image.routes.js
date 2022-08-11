const { URL_API, PORT_API, TOKEN_API } = process.env
const multer = require('multer')
const fs = require('fs')
const util = require('util')
const fetch = require('node-fetch');
const FormData = require('form-data');

const unlinkFile = util.promisify(fs.unlink)
const { Image } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const { haveYouThePermission } = require('../../auth/accessControl')
const BucketS3Service = require('../../files/s3')
const ApiService = require('../../services/apiService')



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

          const path = `${imageFrom}/${typeImage}/${filename}`

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

  router.route('/images/scraping')
    .post(
      async (req, res, next) => {
        try {

          const { query } = req
          const { url, typeImage, imageFrom, name, id_, positionImage } = query
          // let dlFile = `./src/files/download/${name}_${id_}I${Date.now()}D`


          // if (positionImage && typeImage && typeImage === 'large')
          //   dlFile = `${dlFile}${positionImage}P.jpg`
          // else
          //   dlFile = `${dlFile}.jpg`

          let dlFile = `./src/files/download/${Date.now()}`
          const response = await fetch(url);
          const buffer = await response.buffer();
          fs.writeFile(dlFile, buffer, () => { });

          const fd = new FormData()
          fd.append('image', fs.createReadStream(dlFile))
          fd.append('typeImage', `${typeImage}s`)
          fd.append('imageFrom', `${imageFrom}s`)
          if (name) fd.append('name', `${name}`)
          if (id_) fd.append('id_', `${id_}`)
          if (positionImage) fd.append('positionImage', `${positionImage}`)

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
          const resImage = await as.doRequest('POST', `/images`, fd)

          fs.rm(dlFile, () => { })

          res.status(200).json({ url: resImage.data })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  router.route('/image/:imageFrom/:typeImage/:key')
    .get(
      async (req, res, next) => {
        try {
          const { params } = req
          const { imageFrom, typeImage, key } = params

          const path = `${imageFrom}/${typeImage}`
          const bucketS3Service = new BucketS3Service('image')
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
          const { imageFrom, typeImage, key } = params

          const path = `${imageFrom}/${typeImage}/${key}`
          const bucketS3Service = new BucketS3Service('image')
          await bucketS3Service.deleteFile(path)
          console.log("deleted from s3")

          res.status(204).json({})
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}
