const { NODE_ENV } = process.env

const { ModifEntityRequest } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const includeEntity = require('../relations/includeEntity')
const { haveYouThePermission } = require('../../auth/accessControl')
const tools = require('../../tools/tools')

const BucketS3Service = require('../../files/s3')
const multer = require('multer')
const upload = multer({ dest: './src/files/uploads' })
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

module.exports = (router) => {
  router.route('/modif-entity-requests')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req
          const { page, limit } = query

          const paginations = tools.pagination({ page, limit })
          const options = {
            attributes: { exclude: ["body", "query", "UserId"] },
            include: [
              { model: User, attributes: ["id", "showName", "username"] }
            ],
            ...paginations
          }
          const modifEntityRequests = await ModifEntityRequest.findAll(options)

          res.status(200).json({ requests: modifEntityRequests })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createOwn', 'all'),
      upload.fields([
        { name: 'thumbnail' },
        { name: 'images' },
        { name: 'profilImage' },
        { name: 'coverImage' },
        { name: 'videos' },
        { name: 'audios' },
      ]),
      async (req, res, next) => {
        try {
          const { body, user: { username }, files } = req

          const options = {
            attributes: { exclude: ["body", "query", "UserId"] },
            include: [
              { model: User, attributes: ["id", "showName", "username"] }
            ],
          }

          let itemCreated = { id: idRquest, entity, body: bodyEntity } = await ModifEntityRequest.create(body)

          bodyEntity = JSON.parse(bodyEntity)

          if (files) {
            for (const [key, value] of Object.entries(files)) {
              if (typeof value === 'object' && Array.isArray(value) && /^images$/i.test(key)) {
                const urls = []
                for (const file of value) {

                  let filename = `${entity}E${idRquest}I${Date.now()}D.${tools.selectExtByMimeType(file.mimetype)}`;

                  const path = `${NODE_ENV}/${key}/${filename}`

                  const bucketS3Service = new BucketS3Service('modif_request')
                  const uploadResult = await bucketS3Service.uploadFile(path, file)
                  await unlinkFile(file.path)

                  urls.push(uploadResult.Key)
                }
                bodyEntity[key] = urls
              } else if (typeof value === 'object' && Array.isArray(value) && !/^images$/i.test(key)) {
                const file = value[0]
                let filename = `${entity}E${idRquest}I${Date.now()}D.${tools.selectExtByMimeType(file.mimetype)}`;

                const path = `${NODE_ENV}/${key}/${filename}`

                const bucketS3Service = new BucketS3Service('modif_request')
                const uploadResult = await bucketS3Service.uploadFile(path, file)
                await unlinkFile(file.path)

                bodyEntity[key] = uploadResult.Key
              }
            }

            await itemCreated.update({ body: JSON.stringify(bodyEntity) })
          }

          let modifEntityRequestsFound = await ModifEntityRequest.findByPk(idRquest, { attributes: ["id"] })

          const userFound = await User.findOne({ where: { username }, rejectOnEmpty: true })
          await userFound.addModifEntityRequest(modifEntityRequestsFound)

          modifEntityRequestsFound = await ModifEntityRequest.findByPk(idRquest, options)
          res.status(201).json({ request: modifEntityRequestsFound })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  /** ITEMS OPPERATION */
  router.route('/modif-entity-request/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: { exclude: ["UserId"] },
            include: [
              { model: User, attributes: ["id", "showName", "username"] }
            ],
            rejectOnEmpty: true
          }
          const modifEntityRequest = await ModifEntityRequest.findByPk(id, options)

          res.status(200).json({ request: modifEntityRequest })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
  router.route('/modif-entity-request/:id/checked')
    .patch(
      haveYouThePermission('updateAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          await ModifEntityRequest.findByPk(id, { rejectOnEmpty: true })
          await ModifEntityRequest.update({ published: true }, { where: { id } })

          const options = {
            attributes: { exclude: ["body", "query", "UserId"] },
            include: [
              { model: User, attributes: ["id", "showName", "username"] }
            ],
          }
          const modifEntityRequest = await ModifEntityRequest.findByPk(id, { ...options, rejectOnEmpty: true })
          res.status(200).json({ request: modifEntityRequest })
        } catch (err) {
          if (err.name.localeCompare(ONLY_UPDATE_PUBLISHED) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/contributors/:entity/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query, params } = req
          const { page, limit } = query
          const { entity, id: idEntity } = params

          const paginations = tools.pagination({ page, limit })
          const options = {
            where: {
              entity,
              idEntity,
              published: true
            },
            group: ["User.id"],
            attributes: ["User.id"],
            include: [
              { model: User, attributes: ["id", "showName", "username"] }
            ],
            ...paginations
          }
          const modifEntityRequests = await ModifEntityRequest.findAll(options)

          res.status(200).json({ contributors: modifEntityRequests })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route(`/modif-entity-request`)
    .get(
      async (req, res, next) => {
        try {
          const { query: { url } } = req

          const bucketS3Service = new BucketS3Service('modif_request')
          const getResult = await bucketS3Service.getFile(url)

          getResult.pipe(res)
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}

