const Models = { Master, Artist, Format, Genre, Style, Label, Audio, CreditsInMaster, MainArtistsInMaster } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const Tools = require('../../tools/tools')
const imageTools = require('../../tools/images.tool')
const imageManagmentCall = require('../../tools/imageManagmentCall.tool')
const includeEntity = require('../relations/includeEntity')
const { Op, ValidationError, UniqueConstraintError } = require('sequelize')
const { haveYouThePermission } = require('../../auth/accessControl')

const multer = require('multer')
const upload = multer({ dest: './src/files/uploads' })

const { URL_API, PORT_API, TOKEN_API } = process.env
const ApiService = require('../../services/apiService')
const FormData = require('form-data');


module.exports = (router) => {
  router.route('/masters')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req;
          let { getIdMaster, isNoLimitPagination, isErreurScraping } = query;
          // isErreurScraping = isErreurScraping == 'true' ? true : false
          // isForScrapingMaj = isForScrapingMaj == 'true' ? true : false

          // const paginations = Tools.pagination(query);
          // const filter = Tools.filter(query);

          // const includes = {
          //   attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"],
          //   include: filter.include
          // }
          // if (getIdMaster) includes.attributes = ["idMaster"]
          // const options = {
          //   ...includes,
          //   ...paginations,
          //   ...filter
          // };

          let { isForScrapingMaj } = query;
          isForScrapingMaj = isForScrapingMaj == 'true' ? true : false

          let where = !isForScrapingMaj
            ? {
              [Op.and]: [
                { idMaster: { [Op.not]: null } },
                { title: { [Op.not]: null } },
              ]
            }
            : {
              [Op.and]: [
                {
                  idMaster: {
                    [Op.or]: [
                      { [Op.is]: null },
                      { [Op.not]: null }
                    ]
                  }
                },
                { title: { [Op.is]: null } },
              ]
            }


          const paginations = Tools.pagination(query);
          const options = {
            attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"],
            ...paginations
          }
          if (getIdMaster) options.attributes = ["idMaster"]
          options.where = { ...where, ...options.where }


          const masters = await Master.findAll(options)
          res.status(200).json({ masters })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createAny', 'master'),
      upload.fields([{ name: 'thumbnail' }, { name: 'images' }]),
      async (req, res, next) => {
        try {
          const { body, files } = req
          const master = { artists, styles, genres, labels, formats } = body
          const masterCreated = await Master.create(master)
          let findOne = {};

          if (master.genres) {
            master.genres = master.genres.map(g => {
              if (/hip\shop/i.test(g)) return "Hip-Hop"
              return g
            })
          }

          // await extractTrackList(body, masterCreated)
          for (const key of Object.keys(master)) {
            let values = master[key]
            const capitelizeKey = Tools.capitelize(key)
            const entity = Tools.noFinalLetter(capitelizeKey)
            switch (true) {
              case (values && /style/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Style.findAll({ where: { name: value }, include: [{ model: Genre }] })
                  if (findOne !== null) {
                    for (const s of findOne) {
                      const sGenreName = s.Genre.name
                      if (master.genres.includes(sGenreName)) await masterCreated.addStyle(s)
                      // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: 'genre' }) })
                    }
                  }
                }
                break;
              case (values && /genre/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Genre.findOne({ where: { name: value } })
                  if (findOne !== null) await masterCreated.addGenre(findOne)
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: 'genre' }) })
                }
                break;
              case (values && /artist/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Artist.findOne({ where: { idArtist: value.idArtist } })
                  if (findOne !== null) await masterCreated.addMasterMainArtist(findOne)
                  else await masterCreated.createMasterMainArtist(value)
                }
                break;
              case (values && /label/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Label.findOne({ where: { idLabel: value.idLabel } })
                  if (findOne !== null) await masterCreated.addLabel(findOne)
                  else await masterCreated.createLabel(value)
                }
                break;
              case (values && /credit/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Artist.findOne({ where: { idArtist: value.idArtist } })
                  if (findOne !== null) await masterCreated.addMasterCredit(findOne, { through: { roleCredit: value.roleCredit, typeCredit: 'MASTER_CREDIT' } })
                  else await masterCreated.createMasterCredit(value, { through: { roleCredit: value.roleCredit, typeCredit: 'MASTER_CREDIT' } })
                }
                break;
              case (values && /version/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Vinyl.findOne({ where: { idRelease: value.idRelease } })
                  if (findOne !== null) await masterCreated.addVinyl(findOne)
                  else {
                    const { URL_API, PORT_API, TOKEN_API } = process.env
                    const APIService = require('./../../services/apiService')
                    const callApi = new APIService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
                    await callApi.doRequest('POST', '/vinyls', value)

                    findOne = await Models.Vinyl.findOne({ where: { idRelease: value.idRelease } })
                    await masterCreated.addVinyl(findOne)
                  }
                }
                break;
              default: break;
            }
          }

          if (files) {
            if (files.thumbnail) {
              // const masterImage = await imageTools.uploadImageFile(files.thumbnail, 'master', masterCreated)
              // await masterCreated.update(masterImage)

              const options = imageTools.getOptionForuploadImageFile(files.thumbnail, 'master', masterCreated, master)
              const masterImage = await imageTools.uploadImageFile(options)
              await masterCreated.update(masterImage)
            }
            if (files.images) {
              // const masterImage = await imageTools.uploadImageFile(files.images, 'master', masterCreated)
              // await masterCreated.update(masterImage)

              const ImageService = require('./../../services/imageService')
              const is = new ImageService(files.images)
              const masterImage = await is.uploadArrayImageFiles({ imageFrom: 'master', typeImage: 'large', itemDb: masterCreated, itemAd: master })
              await masterCreated.update(masterImage)
            }
          }

          console.log("MASTER CREATED !!")
          console.log("-----------------")


          res.status(201).json({ master: masterCreated })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
            const response = res.status(400)
            const responseObject = { message: ErrorMessage.getMessageByStatusCode(400, { entity: 'master' }) }
            next({ ...responseObject, resourceObject: { entity: 'master' } })
            return response.json(responseObject)
          }
          res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/masters/search')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req
          const { withCol = null } = query
          if (!withCol || (withCol && (!withCol.field || !withCol.value))) throw { name: 'VinymatiApiNoCriteriaError' }

          const withColObject = Tools.getWithColAsArray(withCol)
          const whereClause = withColObject.map(({ field, value }) => Tools.autocomplete(field, value))

          const options = { attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"] }
          options.where = whereClause

          const masterFound = await Master.findAll(options)

          res.status(200).json({ masters: masterFound })
        } catch (err) {
          if (err.name.localeCompare(NO_CRITRIA_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/master/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const options = {
            attributes: ["id", "idMaster", "title", "description", "releaseDate", "thumbnail", "images", "masterUrl", "resourceUrl"],
            include: [
              { model: Vinyl, attributes: ["id", "idRelease", "title", "thumbnail", "vinylUrl", "resourceUrl"] },
              { model: Artist, as: "MasterMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Artist, as: "MasterCredits", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: ["roleCredit", "typeCredit"] } },
              { model: Genre, attributes: ["id", "name"], through: { attributes: [] } },
              { model: Style, attributes: ["id", "name"], through: { attributes: [] } },
            ],
            rejectOnEmpty: true
          };

          const master = await Master.findByPk(+(id), options)
          req.results = { master }

          next()
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })
    .patch(
      haveYouThePermission('updateAny', 'master'),
      upload.fields([{ name: 'thumbnail' }, { name: 'images' }]),
      async (req, res, next) => {
        try {
          const othersToUpdate = {}
          const { body, params, files } = req
          const { id } = params
          const master = { artists, styles, genre, label, format } = body
          let masterFound = await Master.findByPk(id, { rejectOnEmpty: true });

          /** IMAGES */
          const allImages = await imageManagmentCall(files, master, {
            dbItem: masterFound,
            imageFrom: 'master'
          })

          othersToUpdate.thumbnail = allImages.thumbnail;
          othersToUpdate.images = allImages.images;
          /** IMAGES */

          if (master.tracklist && master.tracklist.length > 0) {
            for (const track of master.tracklist) {
              if (track.type && !(/heading/i.test(track.type))) await masterFound.createAudio(track)
            }
            othersToUpdate.tracks = JSON.stringify(master.tracklist);

          }

          for (const key of Object.keys(master)) {
            const values = master[key]
            const capitelizeKey = Tools.capitelize(key)
            const entity = Tools.noFinalLetter(capitelizeKey)
            let entityObject = {}, toUpdate = null
            switch (true) {
              case (values && /styles|genre|format/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await masterFound[`get${entity}s`](),
                  new: values
                };

                for (const eOld of entityObject.old) {
                  eOld.removeMaster(masterFound)
                };

                for (const eNew of entityObject.new) {
                  toUpdate = await Models[entity].findOne({ where: eNew });
                  if (toUpdate !== null) await masterFound[`add${entity}`](toUpdate)
                }
                console.log(`${entity} Changed !!`)
                break;
              case (values && /artists/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await masterFound.getMasterMainArtists(),
                  new: values
                };

                for (const eOld of entityObject.old) {
                  eOld.removeMasterMainArtist(masterFound)
                };

                for (const eNew of entityObject.new) {
                  toUpdate = await Models[entity].findOne({ where: { idArtist: eNew.idArtist } });
                  if (toUpdate !== null) await masterFound[`addMasterMainArtist`](toUpdate)
                  else await masterFound[`createMasterMainArtist`](eNew)
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`Artist Changed !!`)
                break;
              case (values && /credits/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await masterFound.getMasterCredits(),
                  new: values
                };

                for (const eOld of entityObject.old) {
                  eOld.removeMasterCredit(masterFound)
                };

                for (const eNew of entityObject.new) {
                  if (eNew && eNew.idArtist) {
                    toUpdate = await Models.Artist.findOne({ where: { idArtist: eNew.idArtist } });
                    if (toUpdate !== null) await masterFound[`addMasterCredit`](toUpdate)
                    else await masterFound[`createMasterCredit`](eNew)
                  }
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`Credit Changed !!`)
                break;
              case (values && /label/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await masterFound[`getLabels`](),
                  new: values
                };

                for (const eOld of entityObject.old) {
                  eOld.removeMaster(masterFound)
                };

                for (const eNew of entityObject.new) {
                  toUpdate = await Models[entity].findOne({ where: { idLabel: eNew.idLabel } });
                  if (toUpdate !== null) await masterFound[`addLabel`](toUpdate)
                  else await masterFound[`createLabel`](eNew)
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`Label Changed !!`)
                break;
              default:
                // console.log(`Not in { artists, styles, genre, label, format }`)
                break;
            }
          }

          // if (files || (master && (master.thumbnail === '' || master.images === ''))) {
          //   if ((files && files.thumbnail) || master.thumbnail === '') {
          //     const options = imageTools.getOptionForuploadImageFile(files.thumbnail, 'master', masterFound, master)
          //     const masterImage = await imageTools.uploadImageFile(options)
          //     await masterFound.update(masterImage)
          //   }

          //   if (files.images || master.images === '') {
          //     const ImageService = require('./../../services/imageService')
          //     const is = new ImageService(files.images)
          //     const masterImage = await is.uploadArrayImageFiles({ imageFrom: 'master', typeImage: 'images', itemDb: masterFound, itemAd: master })
          //     await masterFound.update(masterImage)
          //   }

          //   // if (files.images || master.images === '') {
          //   //   const masterImage = await imageTools.uploadImageFiles(files.images, 'master', { itemDb: masterFound, itemAd: master })
          //   //   await masterFound.update(masterImage)
          //   // }
          // } else {
          //   if (master.thumbnail) {
          //     if (!masterFound.thumbnail || /discogs/i.test(masterFound.thumbnail)) {
          //       /** TODO = imageFrom: "test" => "master" */
          //       const resImage = await imageTools.getImageUrl(master.thumbnail, { imageFrom: 'master', typeImage: 'thumbnail', id_: masterFound.id, name: master.title })
          //       const { data: { url } } = resImage
          //       othersToUpdate.thumbnail = url.url;
          //     }
          //   }

          //   if (master.images) {
          //     if ((masterFound.images && masterFound.images.length === 0) || masterFound.images === null || /discogs/i.test(masterFound.images[0])) {
          //       const largeImages = [];
          //       let positionImage = 1
          //       for (const image of master.images) {
          //         /** TODO = imageFrom: "test" => "master" */
          //         const resImage = await imageTools.getImageUrl(image, { imageFrom: 'master', typeImage: 'large', id_: masterFound.id, name: master.title, positionImage })
          //         const { data: { url } } = resImage
          //         largeImages.push(url.url)
          //         positionImage += 1
          //       }
          //       othersToUpdate.images = largeImages;
          //     }
          //   }
          // }

          // if (master.idMaster) othersToUpdate.idMaster = master.idMaster;
          if (master.title) othersToUpdate.title = master.title;
          if (master.description) othersToUpdate.description = master.description;
          if (master.releaseDate) othersToUpdate.releaseDate = master.releaseDate;

          await masterFound.update(othersToUpdate)
          masterFound = await Master.findByPk(id, { rejectOnEmpty: true });

          console.log(`MASTER  CHANGED !!`)
          console.log(`-----------------`)
          res.status(200).json({ master: masterFound })
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

  router.route('/master/idMaster/:idMaster')
    .patch(
      haveYouThePermission('updateAny', 'master'),
      async (req, res, next) => {
        try {
          const { body, params } = req
          const { idMaster } = params
          const master = { artists, styles, genre, label, format } = body
          let masterFound = await Master.findOne({ attributes: ["id"], where: { idMaster }, rejectOnEmpty: true });

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
          const resPatchMaster = await as.doRequest('PATCH', `/master/${masterFound.id}`, master)

          res.status(200).json({ master: resPatchMaster.data.master })
        } catch (err) {
          // if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
          //   const response = res.status(400)
          //   const responseObject = { message: ErrorMessage.getMessageByStatusCode(400, { entity: 'master' }) }
          //   next({ ...responseObject, resourceObject: { entity: 'master' } })
          //   return response.json(responseObject)
          // }

          res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
          // next(err)
          // -----------
          // next(err)
        }
      })

  router.route('/master/:id/versions')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const options = {
            attributes: ["id", "title"],
            include: [
              { model: Vinyl, attributes: ["id", "idRelease", "title", "thumbnail", "vinylUrl", "resourceUrl"] },
            ],
            rejectOnEmpty: true
          };
          const master = await Master.findByPk(+(id), options)
          res.status(200).json({ master })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })
}

