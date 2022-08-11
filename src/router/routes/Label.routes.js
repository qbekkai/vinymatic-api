const { Label, SocietesInVinyl, sequelize } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const Tools = require('../../tools/tools')
const includeEntity = require('../relations/includeEntity')
const { ValidationError, UniqueConstraintError, QueryTypes } = require('sequelize')
const Op = require('sequelize').Op;

const multer = require('multer')
const upload = multer({ dest: './src/files/uploads' })

const { URL_API, PORT_API, TOKEN_API } = process.env
const ApiService = require('../../services/apiService')
const { haveYouThePermission } = require('../../auth/accessControl')
const imageTools = require('../../tools/images.tool')
const imageManagmentCall = require('../../tools/imageManagmentCall.tool')


module.exports = (router) => {
  router.route('/labels')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req;
          let { isForScrapingMaj, isErreurScraping } = query;

          isErreurScraping = isErreurScraping == 'true' ? true : false
          isForScrapingMaj = isForScrapingMaj == 'true' ? true : false


          // const pagination = Tools.pagination(query);
          // const filter = Tools.filter(query, { entity: 'label' });

          // const includes = {
          //   ...includeEntity.routes.label.gets,
          //   include: filter.include
          // }
          // if (query && query.getIdLabel) includes.attributes = ['idLabel']
          // const options = {
          //   // ...includes,
          //   ...pagination,
          //   // ...filter
          // };


          let where = {}
          if (isForScrapingMaj) {
            where = {
              [Op.and]: [
                { idLabel: { [Op.not]: null } },
                {
                  thumbnail: {
                    [Op.or]: [
                      { [Op.is]: null },
                      { [Op.substring]: '%discogs%' }
                    ]
                  }
                },
                {
                  images: {
                    [Op.or]: [
                      { [Op.is]: null },
                      { [Op.substring]: '%discogs%' }
                    ]
                  }
                },
              ]
            }

          } else if (isErreurScraping) {
            where = {
              [Op.and]: [{ idLabel: { [Op.is]: null } }]
            }
          } else {
            where = {
              [Op.and]: [
                { idLabel: { [Op.not]: null } },
                {
                  thumbnail: {
                    [Op.and]: [
                      { [Op.not]: null },
                      { [Op.notLike]: '%discogs%' }
                    ]
                  }
                },
                {
                  images: {
                    [Op.and]: [
                      { [Op.not]: null },
                      { [Op.notLike]: '%discogs%' }
                    ]
                  }
                },
              ]
            }
          }

          const paginations = Tools.pagination(query);
          const options = {
            ...paginations
          }
          options.where = { ...where, ...options.where }


          const labels = await Label.findAll(options)
          res.status(200).json({ labels })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createAny', 'all'),
      async (req, res, next) => {
        try {
          const { body: label } = req
          const labelCreated = await Label.create(body)

          if (files || (label && (label.thumbnail === '' || label.images === ''))) {
            if ((files && files.thumbnail) || label.thumbnail === '') {
              const options = imageTools.getOptionForuploadImageFile(files.thumbnail, 'label', labelCreated, label)
              const labelImage = await imageTools.uploadImageFile(options)
              await labelCreated.update(labelImage)
            }


            if (files.images || label.images === '') {
              const ImageService = require('./../../services/imageService')
              const is = new ImageService(files.images)
              const labelImage = await is.uploadArrayImageFiles({ imageFrom: 'label', typeImage: 'large', itemDb: labelCreated, itemAd: label })
              await labelCreated.update(labelImage)
            }
          } else {
            if (label.thumbnail) {
              if (!labelCreated.thumbnail || /discogs/i.test(labelCreated.thumbnail)) {
                const resImage = await imageTools.getImageUrl(label.thumbnail, { imageFrom: 'label', typeImage: 'thumbnail', id_: labelCreated.id, name: label.title })
                const { data: { url } } = resImage
                label.thumbnail = url.url;
              }
            }

            if (label.images) {
              if ((labelCreated.images && labelCreated.images.length === 0) || labelCreated.images === null || /discogs/i.test(labelCreated.images[0])) {
                const largeImages = [];
                let positionImage = 1
                for (const image of label.images) {
                  const resImage = await imageTools.getImageUrl(image, { imageFrom: 'label', typeImage: 'large', id_: labelCreated.id, name: label.title, positionImage })
                  const { data: { url } } = resImage
                  largeImages.push(url.url)
                  positionImage += 1
                }
                label.images = largeImages;
              }
            }
            await labelCreated.update(label)
          }


          res.status(201).json({ label: labelCreated })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/label/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const options = {
            attributes: ["id", "idLabel", "name", "thumbnail", "images"],
            include: [
              { model: Vinyl, as: "VinylLabels", attributes: ["id", "idRelease", "title", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: ["catno"] } },
              { model: Vinyl, as: "VinylSocietes", attributes: ["id", "idRelease", "title", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: ["roleSociete", "typeSociete"] } },
              { model: Vinyl, as: "VinylSeries", attributes: ["id", "idRelease", "title", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: ["catno"] } }
            ],
            rejectOnEmpty: true,
            // raw: true
          }
          const label = await Label.findByPk(id, options)
          // res.status(201).json({ label })

          req.results = { label }

          next()
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })
    .patch(
      haveYouThePermission('updateAny', 'all'),
      upload.fields([{ name: 'thumbnail' }, { name: 'images' }]),
      async (req, res, next) => {
        try {
          const othersToUpdate = {}
          const { body: label, params, files } = req
          const { id } = params

          let labelFound = await Label.findByPk(id, { rejectOnEmpty: true })

          /** IMAGES */
          const allImages = await imageManagmentCall(files, label, {
            dbItem: labelFound,
            imageFrom: 'label'
          })

          othersToUpdate.thumbnail = allImages.thumbnail;
          othersToUpdate.images = allImages.images;
          /** IMAGES */

          // if (files || (label && (label.thumbnail === '' || label.images === ''))) {
          //   if ((files && files.thumbnail) || label.thumbnail === '') {
          //     const options = imageTools.getOptionForuploadImageFile(files.thumbnail, 'label', labelFound, label)
          //     const labelImage = await imageTools.uploadImageFile(options)
          //     await labelFound.update(labelImage)
          //   }


          //   if (files.images || label.images === '') {
          //     const ImageService = require('./../../services/imageService')
          //     const is = new ImageService(files.images)
          //     const labelImage = await is.uploadArrayImageFiles({ imageFrom: 'label', typeImage: 'large', itemDb: labelFound, itemAd: label })
          //     await labelFound.update(labelImage)
          //   }
          // } else {
          //   if (label.thumbnail) {
          //     if (!labelFound.thumbnail || /discogs/i.test(labelFound.thumbnail)) {
          //       const resImage = await imageTools.getImageUrl(label.thumbnail, { imageFrom: 'label', typeImage: 'thumbnail', id_: labelFound.id, name: label.name })
          //       const { data: { url } } = resImage
          //       label.thumbnail = url.url;
          //     }
          //   }

          //   if (label.images) {
          //     if ((labelFound.images && labelFound.images.length === 0) || labelFound.images === null || /discogs/i.test(labelFound.images[0])) {
          //       const largeImages = [];
          //       let positionImage = 1
          //       for (const image of label.images) {
          //         const resImage = await imageTools.getImageUrl(image, { imageFrom: 'label', typeImage: 'large', id_: labelFound.id, name: label.name, positionImage })
          //         const { data: { url } } = resImage
          //         largeImages.push(url.url)
          //         positionImage += 1
          //       }
          //       label.images = largeImages;
          //     }
          //   }
          //   await labelFound.update(label)
          // }

          if (label.name) othersToUpdate.name = label.name;

          const labelUpdated = await labelFound.update(othersToUpdate)
          if (labelUpdated == null || labelUpdated[0] === 0) throw { name: 'VinymaticApiNoModification' }

          labelFound = await Label.findByPk(id, { rejectOnEmpty: true })
          res.status(200).json({ label: labelFound })
        } catch (err) {
          if (err.name.localeCompare(NO_MODIFICATION_ERROR) === 0)
            return res.status(304).json({ message: "Aucune modification apporter" })

          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/label/name/:name')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { name: nameLabel } = req.params;

          const options = {
            attributes: ["id", "name", "thumbnail"],
            where: {
              name: {
                [Op.substring]: nameLabel
              }
            },
            //...includeEntity.routes.label.gets,
            rejectOnEmpty: true
          }
          const labelFound = await Label.findAll(options)
          res.status(200).json({ labels: labelFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })

  router.route('/label/idLabel/:idLabel')
    .patch(
      haveYouThePermission('updateAny', 'all'),
      async (req, res, next) => {
        try {

          const { body: label, params } = req
          const { idLabel } = params
          let labelFound = await Label.findOne({ attributes: ["id"], where: { idLabel }, rejectOnEmpty: true });

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
          const resPatchLabel = await as.doRequest('PATCH', `/label/${labelFound.id}`, label)

          res.status(200).json({ label: resPatchLabel.data.label })


          // const label = req.body
          // const { idLabel } = req.params
          // let labelFound = await Label.findOne({ where: { idLabel } });
          // if (labelFound === null) {
          //   const response = res.status(404)
          //   const responseObject = { message: ErrorMessage.getMessageByStatusCode(404, { entity: 'label' }) }
          //   next({ ...responseObject, resourceObject: { entity: 'label' } })
          //   return response.json(responseObject)
          // }
          // await labelFound.update(label)
          // labelFound = await Label.findOne({ where: { idLabel } });
          // console.log(`LABEL  CHANGED !!`)
          // console.log(`-----------------`)
          // res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { updatedRessource: true }), label: labelFound })
        } catch (err) {
          // if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
          //   const response = res.status(400)
          //   const responseObject = { message: ErrorMessage.getMessageByStatusCode(400, { entity: 'label' }) }
          //   next({ ...responseObject, resourceObject: { entity: 'label' } })
          //   return response.json(responseObject)
          // }
          // res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
          // next(err)
          // ---------------
          next(err)
        }
      })

  router.route('/labels/roleSocietes')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          let roleSocietesFound = await sequelize.query(
            "SELECT roleSociete FROM SocietesInVinyls GROUP BY roleSociete",
            { model: SocietesInVinyl, type: QueryTypes.SELECT }
          )

          roleSocietesFound = roleSocietesFound.map(rsf => rsf.roleSociete)

          res.status(200).json({ roleSocietes: roleSocietesFound })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}

