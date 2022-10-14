const Models = { FormatDescription, FormatSide, FormatSize, FormatSpeed, FormatVoice, FormatInVinyl, Identifier, User, Wishlist, Collection, Vinyl, Artist, Format, Genre, Style, Label, Audio, User, sequelize } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const Tools = require('../../tools/tools')
const imageTools = require('../../tools/images.tool')
const imageManagmentCall = require('../../tools/imageManagmentCall.tool')
const includeEntity = require('../relations/includeEntity')
const { ValidationError, UniqueConstraintError, Op } = require('sequelize')
const { haveYouThePermission } = require('../../auth/accessControl')

const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)
const BucketS3Service = require('../../files/s3')

const multer = require('multer')
const upload = multer({ dest: './src/files/uploads' })

const { URL_API, PORT_API, TOKEN_API } = process.env
const ApiService = require('../../services/apiService')
const FormData = require('form-data');
const ImageManagement = require('../../tools/ImageManagement.tool')


const { addFormat } = require('../../tools/format.tool')
const { getOrderOptions, getFilterOptions } = require('../relations/includeEntity')
const filters = require('../filters')
const sorts = require('../sorts')



module.exports = (router) => {
  router.route('/vinyls')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query, url } = req;
          let { getIdRelease, isNoLimitPagination, isForScrapingMaj, isErreurScraping, sort } = query;
          isErreurScraping = isErreurScraping == 'true' ? true : false
          isForScrapingMaj = isForScrapingMaj == 'true' ? true : false


          let options = {
            attributes: getIdRelease
              ? ["idRelease"]
              : ["id", "idRelease", "title", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"],
            include: [],
            order: []
            // raw: true
          }
          options = Tools.nPagination(query, options);
          // options = filters.byVerified(url, query, options)
          options = getFilterOptions(url, query, options)

          // if (query.formatSize) options = filters.byFormatSize(query.formatSize, options)
          // if (query.format) options = filters.byFormat(query.format, options)

          if (sort) {
            for (let orderIndex = 0; orderIndex < sort.by.length; orderIndex++) {
              switch (true) {
                case /title/i.test(sort.by[orderIndex]):
                  options = sorts.byTitle(sort.direction[orderIndex], options);
                  break;
                case /releaseDate/i.test(sort.by[orderIndex]):
                  options = sorts.byReleaseDate(sort.direction[orderIndex], options);
                  break;
                case /artist/i.test(sort.by[orderIndex]):
                  options = sorts.byMainArtist(sort.direction[orderIndex], options);
                  break;
                case /label/i.test(sort.by[orderIndex]):
                  options = sorts.byLabel(sort.direction[orderIndex], options);
                  break;
                default: throw { name: 'VinymaticApiRequestError:SortNotExist' }
              }
            }
          }

          // const options = includeEntity.getOptionsForSQLRequest(includeEntity, url, query, { getIdRelease, isNoLimitPagination })
          // const options = {
          //   attributes: ["id", "idRelease", "title", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"],
          //   where
          // }

          const where = !isForScrapingMaj
            ? {
              [Op.and]: [
                { idRelease: { [Op.not]: null } },
                { title: { [Op.not]: null } },
              ]
            }
            : {
              [Op.and]: [
                {
                  idRelease: {
                    [Op.or]: [
                      { [Op.is]: null },
                      { [Op.not]: null }
                    ]
                  }
                },
                { title: { [Op.is]: null } },
              ]
            }

          options.where = { ...where, ...options.where }

          const vinyls = await Vinyl.findAll(options)
          res.status(200).json({ vinyls })
        } catch (err) {
          if (/VinymaticApiRequestError:SortNotExist/.test(err.name))
            return res.status(400).json({ message: "VinymaticApiRequestError:SortNotExist" })

          res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createOwn', 'vinyl'),
      upload.fields([{ name: 'thumbnail' }, { name: 'images' }]),
      async (req, res, next) => {
        try {
          const { body, files } = req
          const vinyl = { artists, styles, genre, label, format } = body
          vinyl.idRelease = vinyl.idRelease && typeof vinyl.idRelease === 'string'
            ? +(vinyl.idRelease)
            : vinyl.idRelease

          let { idRelease, images, thumbnail, ...vinylRest } = vinyl
          const vinylCreated = await Vinyl.create({ idRelease: vinyl.idRelease })
          let findOne = null;

          /** IMAGES */
          const allImages = await imageManagmentCall(files, vinyl, {
            dbItem: vinylCreated,
            typeImage: 'vinyl'
          })
          await vinylCreated.update(allImages)

          // let allImages = {}

          // if (files) allImages = new ImageManagement(files, 'vinyl')
          // else {
          //   // if (!thumbnail && thumbnail === undefined) thumbnail = "";
          //   // if ((images && images.length === 0) || images === undefined) images = [];

          //   allImages = await new ImageManagement({
          //     thumbnail,
          //     images
          //   }, 'vinyl', {
          //     isFromScraping: true,
          //     createdItem: vinylCreated,
          //     toPostItem: vinyl
          //   })
          // }

          // const isValid = await allImages.validation().catch(err => { allImages.setError({ isError: true, name: 'VinymaticImagesNotValid', code: err }) })
          // const isError = allImages.getError()
          // if (isError && !isValid) {
          //   for (const err of isError.code.validator) {
          //     switch (true) {
          //       case /NOT_IMAGE_ERROR/.test(err.code):
          //         if (!idRelease) await vinylCreated.update({ thumbnail: null, images: null })
          //         else await vinylCreated.update({ thumbnail: '', images: [] })
          //         break;
          //       case /NOT_EXIST_ERROR/.test(err.code):
          //         await vinylCreated.update({ thumbnail: null, images: null })
          //         break;
          //       default: throw isError;
          //     }
          //   }
          // }
          // allImages = await allImages.postAllImages()
          // await vinylCreated.update(allImages)
          /** IMAGES */

          await vinylCreated.update(vinylRest)

          if (vinyl.idMaster) {
            findOne = await Models.Master.findOne({ where: { idMaster: vinyl.idMaster } })
            if (findOne !== null) await findOne.addVinyl(vinylCreated)
            else await vinylCreated.createMaster({ idMaster: vinyl.idMaster })
          }


          for (const key of Object.keys(vinyl)) {
            const values = vinyl[key]
            const capitelizeKey = Tools.capitelize(key)
            const entity = Tools.noFinalLetter(capitelizeKey)
            switch (true) {
              case (values && /format/i.test(key) && values.length !== 0):
                for (const value of values) {
                  await addFormat(value, vinylCreated)


                  // const format = { name: value.name }
                  // const formatInVinyl = {
                  //   nbFormat: value.nbFormat,
                  //   text: value.text,
                  //   FormatDescriptions: value.descriptions,
                  //   FormatSides: value.sides,
                  //   FormatSizes: value.sizes,
                  //   FormatSpeeds: value.speeds,
                  //   FormatVoices: value.voices,
                  // }

                  // // findOne = await Models.Format.findOne({ where: format })
                  // // if (findOne !== null) {
                  // //   await vinylCreated.addFormat(findOne, {
                  // //     through: {
                  // //       nbFormat: formatInVinyl.nbFormat,
                  // //       text: formatInVinyl.text
                  // //     }
                  // //   })
                  // // } else {
                  // const formatCreated = await vinylCreated.createFormat(format, {
                  //   through: {
                  //     nbFormat: formatInVinyl.nbFormat,
                  //     text: formatInVinyl.text
                  //   }
                  // })

                  // const vinylFormatFound = await FormatInVinyl.findOne({ where: { FormatId: formatCreated.id, VinylId: vinylCreated.id } })

                  // if (formatInVinyl.FormatDescriptions.length > 0) {
                  //   for (const fd of formatInVinyl.FormatDescriptions) {
                  //     const fdFound = await FormatDescription.findOne({ where: { name: fd } })
                  //     if (fdFound) fdFound.addFormatInVinyl(vinylFormatFound)
                  //     // if (fdFound) vinylFormatFound.addFormatDescription(fdFound)
                  //   }
                  // }
                  // if (formatInVinyl.FormatSides.length > 0) {
                  //   for (const fsd of formatInVinyl.FormatSides) {
                  //     const fsdFound = await FormatSide.findOne({ where: { name: fsd } })
                  //     if (fsdFound) fsdFound.addFormatInVinyl(vinylFormatFound)
                  //   }
                  // }
                  // if (formatInVinyl.FormatSizes.length > 0) {
                  //   for (const fsz of formatInVinyl.FormatSizes) {
                  //     const fszFound = await FormatSize.findOne({ where: { name: fsz } })
                  //     if (fszFound) fszFound.addFormatInVinyl(vinylFormatFound)

                  //   }
                  // }
                  // if (formatInVinyl.FormatSpeeds.length > 0) {
                  //   for (const fsp of formatInVinyl.FormatSpeeds) {
                  //     const fspFound = await FormatSpeed.findOne({ where: { name: fsp } })
                  //     if (fspFound) fspFound.addFormatInVinyl(vinylFormatFound)

                  //   }
                  // }
                  // if (formatInVinyl.FormatVoices.length > 0) {
                  //   for (const fv of formatInVinyl.FormatVoices) {
                  //     const fvFound = await FormatVoice.findOne({ where: { name: fv } })
                  //     if (fvFound) fvFound.addFormatInVinyl(vinylFormatFound)

                  //   }
                  // }

                }
                break;
              case (values && /styles|genre/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models[entity].findOne({ where: value })
                  if (findOne !== null) await vinylCreated[`add${entity}`](findOne)
                }
                break;
              case (values && /artists/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Artist.findOne({ where: value })
                  if (findOne !== null) await vinylCreated.addVinylMainArtist(findOne)
                  else await vinylCreated.createVinylMainArtist(value)
                }
                break;
              case (values && /label/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Label.findOne({ where: { idLabel: value.idLabel } })
                  if (findOne !== null) await vinylCreated.addVinylLabel(findOne, { through: { catno: value.catno } })
                  else await vinylCreated.createVinylLabel(value, { through: { catno: value.catno } })
                }
                break;
              case (values && /identifier/i.test(key) && values.length !== 0):
                for (const value of values)
                  vinylCreated.createIdentifier(value)
                break;
              case (values && /societe/i.test(key) && values.length !== 0):
                for (const value of values) {
                  if (/serie/i.test(value.roleSociete)) {
                    findOne = await Models.Label.findOne({ where: { idLabel: value.idLabel } })
                    if (findOne !== null) await vinylCreated.addVinylSery(findOne, { through: { catno: value.catno } })
                    else await vinylCreated.createVinylSery(value, { through: { catno: value.catno } })

                  } else {
                    findOne = await Models.Label.findOne({ where: { idLabel: value.idLabel } })
                    if (findOne !== null) await vinylCreated.addVinylSociete(findOne, { through: { roleSociete: value.roleSociete, typeSociete: 'VINYL_SOCIETE' } })
                    else await vinylCreated.createVinylSociete(value, { through: { roleSociete: value.roleSociete, typeSociete: 'VINYL_SOCIETE' } })

                  }
                }
                break;
              case (values && /credit/i.test(key) && values.length !== 0):
                for (const value of values) {
                  if (value.idArtist) {
                    findOne = await Models.Artist.findOne({ where: { idArtist: value.idArtist } })
                    if (findOne !== null) await vinylCreated.addVinylCredit(findOne, { through: { roleCredit: value.roleCredit, typeCredit: 'VINYL_CREDIT' } })
                    else await vinylCreated.createVinylCredit(value, { through: { roleCredit: value.roleCredit, typeCredit: 'VINYL_CREDIT' } })
                  }
                }
                break;
              default:
                // console.log(`Not in { artists, styles, genre, label, format }`)
                break;
            }
          }

          if (vinyl.tracklist && vinyl.tracklist.length > 0) {
            const tracks = vinyl.tracklist

            for (const track of tracks) {
              const audioCreated = await vinylCreated.createAudio(track)

              /** Main Artist */
              for (const a of track.artists) {
                const artistFound = await Artist.findOne({ where: { idArtist: a.idArtist } })
                if (artistFound !== null) artistFound.addAudioMainArtist(audioCreated)
              }

              /** Credit */
              for (const c of track.credits) {
                const artistFound = await Artist.findOne({ where: { idArtist: c.creditArtistId } })
                if (artistFound !== null) await artistFound.addAudioCredit(audioCreated, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
                else await audioCreated.createAudioCredit({ idArtist: c.creditArtistId }, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
              }

            }
          }

          console.log("VINYL CREATED !!")

          const vinylFound = await Vinyl.findByPk(vinylCreated.id)
          res.status(201).json({ vinyl: vinylFound })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })


  router.route('/vinyls/idRelease')
    .post(
      haveYouThePermission('createOwn', 'vinyl'),
      async (req, res, next) => {
        try {
          let { body: { idRelease } } = req
          idRelease = idRelease && typeof idRelease === 'string' ? +(idRelease) : idRelease

          const vinylCreated = await Vinyl.create({ idRelease })
          console.log("VINYL RELEASE ID CREATED !!")

          const vinylFound = await Vinyl.findByPk(vinylCreated.id)
          res.status(201).json({ vinyl: vinylFound })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  /** ITEMS OPPERATION */
  router.route('/vinyl/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params, url, query } = req
          const { id } = params
          const options = {
            attributes: { exclude: ["MasterId"] },
            // attributes: { exclude: ["MasterId"] },
            include: [
              { model: Identifier, attributes: ["type", "value", "description"] },
              { model: Master, attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl"] },
              { model: Artist, as: "VinylMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Artist, as: "VinylCredits", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: ["roleCredit", "typeCredit"] } },
              { model: Label, as: "VinylLabels", attributes: ["id", "idLabel", "name", "thumbnail"], through: { attributes: ["catno"] } },
              { model: Label, as: "VinylSocietes", attributes: ["id", "idLabel", "name"], through: { attributes: ["roleSociete", "typeSociete"] } },
              { model: Label, as: "VinylSeries", attributes: ["id", "idLabel", "name"], through: { attributes: ["catno"] } },
              // {
              //   model: Format,
              //   attributes: ["id", "name"],
              //   through: {
              //     attributes: ["nbFormat", "text", "FormatSideId", "FormatSizeId", "FormatSpeedId", "FormatVoiceId"],
              //     // include: [
              //     //   //   { model: FormatDescription, through: { attributes: [] } },
              //     //   // { model: FormatSide },
              //     //   // { model: FormatSize },
              //     //   //   { model: FormatSpeed },
              //     //   //   { model: FormatVoice },
              //     // ]
              //   }
              // },
              // {
              //   model: FormatInVinyl,
              //   as: "FormatInVinylExp",
              //   attributes: ["nbFormat", "text"],
              //   include: [
              //     // { model: FormatDescription, through: { attributes: [] } },
              //     // { model: FormatSide },
              //     // { model: FormatSize },
              //     // { model: FormatSpeed },
              //     // { model: FormatVoice },
              //   ]
              // },
              { model: Genre, attributes: ["id", "name"], through: { attributes: [] } },
              { model: Style, attributes: ["id", "name"], through: { attributes: [] } },
              // { model: Audio, attributes: ["id", "title", "audioUrl", "duration", "position"] },
            ],
            rejectOnEmpty: true
          }
          // const options = includeEntity.getOptionsForSQLRequest(includeEntity, url, query)
          const vinyl = await Vinyl.findByPk(id, options)



          req.results = { vinyl }
          next()
        } catch (err) {
          // next(err)
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      haveYouThePermission('updateOwn', 'vinyl'),
      upload.fields([{ name: 'thumbnail' }, { name: 'images' }]),
      async (req, res, next) => {
        try {
          const othersToUpdate = {}
          const { body, params: { id }, files } = req
          const vinyl = { artists, styles, genre, label, format } = body
          let vinylFound = await Vinyl.findByPk(id, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          /** IMAGES */
          const allImages = await imageManagmentCall(files, vinyl, {
            dbItem: vinylFound,
            imageFrom: 'vinyl'
          })

          othersToUpdate.thumbnail = allImages.thumbnail;
          othersToUpdate.images = allImages.images;
          /** IMAGES */



          if (vinyl.tracklist && vinyl.tracklist.length > 0) {
            entityObject = {
              old: await vinylFound.getAudios(),
              new: vinyl.tracklist
            };

            for (const eOld of entityObject.old) {
              await vinylFound.removeAudio(eOld)
              await Audio.destroy({ where: { id: eOld.id } })
            }

            for (const track of entityObject.new) {
              track.image = othersToUpdate.thumbnail
              const audioCreated = await vinylFound.createAudio(track)

              /** Main Artist */
              for (const a of track.artists) {
                const artistFound = await Artist.findOne({ where: { idArtist: a.idArtist } })
                if (artistFound !== null) artistFound.addAudioMainArtist(audioCreated)
              }

              /** Credit */
              if (track.credits && Array.isArray(track.credits)) {
                for (const c of track.credits) {
                  let artistFound = null
                  if (c.creditArtistId) artistFound = await Artist.findOne({ where: { idArtist: c.creditArtistId } })
                  else artistFound = await Artist.findOne({ where: { name: c.creditArtistName } })

                  if (artistFound !== null) await artistFound.addAudioCredit(audioCreated, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
                  else await audioCreated.createAudioCredit({ idArtist: c.creditArtistId ? c.creditArtistId : null }, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
                }
              }
            }
            console.log(`Tracks Changed !!`)
          }

          for (const key of Object.keys(vinyl)) {
            const values = vinyl[key]
            const capitelizeKey = Tools.capitelize(key)
            const entity = Tools.noFinalLetter(capitelizeKey)
            let entityObject = {}, toUpdate = null
            switch (true) {
              case (values && /format/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound.getFormats(),
                  new: values
                };

                for (const eOld of entityObject.old) await eOld.removeVinyl(vinylFound)
                for (const eNew of entityObject.new) {
                  await addFormat(eNew, vinylFound)
                }
                console.log(`Formats Changed !!`)
                break;
              case (values && /styles|genre/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound[`get${entity}s`](),
                  new: values
                };

                for (const eOld of entityObject.old) await eOld.removeVinyl(vinylFound)
                for (const eNew of entityObject.new) {
                  if (/genre/i.test(key)) {
                    eNew.name = eNew.name.replace(/(?:\s|-)/, "(?:\\s|-)")
                    toUpdate = await Models[entity].findOne({ where: { name: { [Op.regexp]: eNew.name } } });
                  } else
                    toUpdate = await Models[entity].findOne({ where: eNew });

                  if (toUpdate !== null) await vinylFound[`add${entity}`](toUpdate)
                  // else await vinylFound[`create${entity}`](eNew)
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`${entity}s Changed !!`)
                break;
              case (values && /artists/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound.getVinylMainArtists(),
                  new: values
                };

                for (const eOld of entityObject.old) await eOld.removeVinylMainArtist(vinylFound)
                for (const eNew of entityObject.new) {
                  toUpdate = await Models.Artist.findOne({ where: { idArtist: eNew.idArtist } });
                  if (toUpdate !== null) await vinylFound.addVinylMainArtist(toUpdate)
                  else await vinylFound.createVinylMainArtist(eNew)
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`Artists Changed !!`)
                break;
              //     case (values && /identifier/i.test(key) && values.length !== 0):
              //       entityObject = {
              //         old: await vinylFound.getIdentifiers(),
              //         new: values
              //       };

              //       for (const eOld of entityObject.old) await vinylFound.removeIdentifier(eOld)
              //       for (const eNew of entityObject.new) await vinylFound.createIdentifier(eNew)
              //       console.log(`Identifiers Changed !!`)
              //       break;
              case (values && /label/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound.getVinylLabels(),
                  new: values
                };

                for (const eOld of entityObject.old) await eOld.removeVinylLabel(vinylFound)
                for (const eNew of entityObject.new) {
                  toUpdate = await Models.Label.findOne({ where: { idLabel: eNew.idLabel } });
                  if (toUpdate !== null) await vinylFound.addVinylLabel(toUpdate, { through: { catno: eNew.catno } })
                  else await vinylFound.createVinylLabel(eNew, { through: { catno: eNew.catno } })
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`Labels Changed !!`)
                break;
              case (values && /societe/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound.getVinylSocietes(),
                  new: values
                };

                for (const eOld of entityObject.old) await eOld.removeVinylSociete(vinylFound)
                for (const eNew of entityObject.new) {
                  if (/serie/i.test(eNew.roleSociete)) {
                    toUpdate = await Models.Label.findOne({ where: { idLabel: eNew.idLabel } })
                    if (toUpdate !== null) await vinylFound.addVinylSery(toUpdate, { through: { catno: eNew.catno } })
                    else await vinylFound.createVinylSery(eNew, { through: { catno: eNew.catno } })

                  } else {
                    toUpdate = await Models.Label.findOne({ where: { idLabel: eNew.idLabel } })
                    if (toUpdate !== null) await vinylFound.addVinylSociete(toUpdate, { through: { roleSociete: eNew.roleSociete, typeSociete: 'VINYL_SOCIETE' } })
                    else await vinylFound.createVinylSociete(eNew, { through: { roleSociete: eNew.roleSociete, typeSociete: 'VINYL_SOCIETE' } })

                  }


                  // toUpdate = await Models.Label.findOne({ where: { idLabel: eNew.idLabel } });
                  // if (toUpdate !== null) await vinylFound.addVinylSociete(toUpdate, { through: { roleSociete: eNew.roleSociete, typeSociete: 'VINYL_SOCIETE' } })
                  // else await vinylFound.createVinylSociete(eNew, { through: { roleSociete: eNew.roleSociete, typeSociete: 'VINYL_SOCIETE' } })
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`Societes Changed !!`)
                break;
              case (values && /credit/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound.getVinylCredits(),
                  new: values
                };

                for (const eOld of entityObject.old) await eOld.removeVinylCredit(vinylFound)
                for (const eNew of entityObject.new) {
                  if (eNew.idArtist)
                    toUpdate = await Models.Artist.findOne({ where: { idArtist: eNew.idArtist } });
                  if (toUpdate !== null) await vinylFound.addVinylCredit(toUpdate, { through: { roleCredit: eNew.roleCredit, typeCredit: 'VINYL_CREDIT' } })
                  else await vinylFound.createVinylCredit(eNew, { through: { roleCredit: eNew.roleCredit, typeCredit: 'VINYL_CREDIT' } })
                  // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
                }
                console.log(`Credits Changed !!`)
                break;
              default:
                // console.log(`Not in { artists, styles, genre, label, format }`)
                break;
            }
          }

          if (vinyl.imagesPosition) {
            // error si: 
            //    - 2 url identique
            //    - array imagesPosition et db images: leur taille sont differente
            const toModif = vinyl.imagesPosition
              .split(',')
              .map(el => el.replace(/^\/images?\/(.+)$/, `$1`))

            for (const i of toModif) {
              const sameURL = toModif.filter(el => el === i)
              if (sameURL.length > 1) throw { name: 'VinymaticApiSameUrlImage' }
            }

            if (vinylFound.images.length !== toModif.length)
              throw { name: 'VinymaticApiLengthDbImageAndLengthPatchImageAreNotEqual' }





            let newPosition = 1
            const bucketS3Service = new BucketS3Service('image')
            othersToUpdate.images = []

            for (let imgToModif of toModif) {
              const newName = imgToModif.replace(/^(.+D)\d+(P\.jpe?g)$/, `$1${newPosition}$2`)
              if (imgToModif.localeCompare(newName) != 0)
                await bucketS3Service.renameFile(imgToModif, newName)
              othersToUpdate.images.push(`/image/${newName}`)
              newPosition++
            }
          }

          if (vinyl.identifiers) {
            entityObject = {
              old: await vinylFound.getIdentifiers(),
              new: vinyl.identifiers
            };

            for (const eOld of entityObject.old) await vinylFound.removeIdentifier(eOld)
            for (const eNew of entityObject.new) {
              const toUpdate = await Models.Identifier.findOne({ where: eNew });
              if (toUpdate !== null) await vinylFound.addIdentifier(toUpdate)
              else await vinylFound.createIdentifier(eNew)
              // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
            }
            console.log(`Identifiers Changed !!`)
          }

          if (vinyl.idMaster) {
            entityObject = {
              old: await vinylFound.getMaster(),
              new: { idMaster: vinyl.idMaster }
            };

            const { old: eOld, new: eNew } = entityObject
            if (entityObject.old) await eOld.removeVinyl(vinylFound)
            if (entityObject.new) {
              const toUpdate = await Models.Master.findOne({ where: { idMaster: eNew.idMaster } });
              if (toUpdate !== null) await toUpdate.addVinyl(vinylFound)
              else await vinylFound.createMaster(eNew)
              // else return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404, { entity: entity }) })
            }
            console.log(`Masters Changed !!`)
          }

          // if (vinyl.idRelease) othersToUpdate.idRelease = vinyl.idRelease;
          if (vinyl.title) othersToUpdate.title = vinyl.title;
          if (vinyl.description) othersToUpdate.description = vinyl.description;
          if (vinyl.country) othersToUpdate.country = vinyl.country;
          if (vinyl.releaseDate) othersToUpdate.releaseDate = vinyl.releaseDate;
          if (vinyl.vinylUrl) othersToUpdate.vinylUrl = vinyl.vinylUrl;
          if (vinyl.resourceUrl) othersToUpdate.resourceUrl = vinyl.resourceUrl;
          // if (vinyl.identifiers) othersToUpdate.identifiers = vinyl.identifiers;


          await vinylFound.update(othersToUpdate)
          vinylFound = await Vinyl.findByPk(id, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          console.log(`VINYL  CHANGED !!`)
          console.log(`-----------------`)
          res.status(200).json({ vinyl: vinylFound })

        } catch (err) {

          if (err.name.localeCompare(NO_MODIFICATION_ERROR) === 0)
            return res.status(304).json({ message: "Aucune modification apporter" })

          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (
            /VinymaticApiLengthDbImageAndLengthPatchImageAreNotEqual/.test(err.name) ||
            /VinymaticApiSameUrlImage/.test(err.name)
          )
            return res.status(400).json(err);

          if (err.statusCode === 404)
            return res.status(404).json({ message: err.message.replace(/key/, 'file') })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/vinyl/idRelease/:idRelease')
    .patch(
      haveYouThePermission('updateAny', 'all'),
      async (req, res, next) => {
        try {
          const { body, params } = req
          const { idRelease } = params
          const vinyl = { artists, styles, genre, label, format } = body
          let vinylFound = await Vinyl.findOne({ attributes: ["id"], where: { idRelease }, rejectOnEmpty: true });

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
          const resPatchVinyl = await as.doRequest('PATCH', `/vinyl/${vinylFound.id}`, vinyl)

          res.status(200).json({ vinyl: resPatchVinyl.data.vinyl })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
            const response = res.status(400)
            const responseObject = { message: ErrorMessage.getMessageByStatusCode(400, { entity: 'vinyl' }) }
            next({ ...responseObject, resourceObject: { entity: 'vinyl' } })
            return response.json(responseObject)
          }
          // return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400, { entity: 'vinyl' }) });
          res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
          // next(err)
        }
      })


  /** GESTION SONGS FILES */
  router.route('/vinyl/:id/tracklist')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params
          const options = {
            attributes: [],
            include: [
              {
                model: Audio,
                attributes: ["id", "position", "title", "mainTitle", "subTitle", "type", "image", "duration", "audioUrl", "resourceUrl"],
                include: [
                  { model: Artist, as: "AudioMainArtists", attributes: ["id", "name", "artistUrl", "resourceUrl"] },
                  { model: Artist, as: "AudioCredits", attributes: ["id", "name", "artistUrl", "resourceUrl"] }
                ]
              }
            ],
            rejectOnEmpty: true
          }
          const audios = await Vinyl.findByPk(id, options)
          // res.status(200).json({ tracklist: audios.Audios })
          req.results = { tracklist: audios.Audios }

          next()
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createOwn', 'vinyl:audio'),
      upload.single('song'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          await Audio.findByPk(id, { rejectOnEmpty: true })

          const { file } = req
          const bucketS3Service = new BucketS3Service('audio')
          const uploadResult = await bucketS3Service.uploadFile(file)
          await unlinkFile(file.path)

          const songUploaded = {
            urlAudio: `/song/${uploadResult.Key}`,
            fileKey: uploadResult.Key
          }

          await Audio.update({ audioUrl: songUploaded.urlAudio }, { where: { id } })
          res.status(200).json({ url: songUploaded })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  router.route('/vinyl/:id/likes')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id: vinylId } = params
          const options = {
            attributes: ["id"],
            include: [
              { model: User, as: "VinylLike", attributes: ["id", "username", "showName"], through: { attributes: [] } }
            ],
            rejectOnEmpty: true
          }
          const userFound = await Vinyl.findByPk(vinylId, options)
          // const likes = await vinylFound.getVinylLike({ attributes: ['id', 'username', 'profilImage'], through: { attributes: [] } });

          res.status(200).json({ vinyl: userFound })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  router.route('/vinyls/discovery')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req;
          const { genre, page } = query;

          const pagination = Tools.pagination({ page, limit: 30 })

          const options = {
            attributes: ["id", "idRelease", "title", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"],
            ...pagination,
            order: sequelize.random()
          };

          if (genre) {
            options.include = [
              { model: Genre, attributes: [], where: { name: genre }, through: { attributes: [] } }
            ]
          }

          const vinyls = await Vinyl.findAll(options)
          res.status(200).json({ vinyls })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  router.route('/vinyl/:id/formats')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params, url, query } = req
          const { id } = params
          const options = {
            attributes: ["id"],
            include: [
              {
                model: FormatInVinyl,
                attributes: ["nbFormat", "text"],
                include: [
                  { model: Format },
                  { model: FormatDescription, through: { attributes: [] } },
                  { model: FormatSide },
                  { model: FormatSize },
                  { model: FormatSpeed },
                  { model: FormatVoice },
                ]
              },
            ],
            rejectOnEmpty: true
          }
          const vinyl = await Vinyl.findByPk(id, options)
          req.results = { formats: vinyl.FormatInVinyls }
          next()
        } catch (err) {
          // next(err)
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/vinyl/:id/images')
    .post(
      upload.single('newImages'),
      // upload.fields([{ name: 'newImages' }]),
      async (req, res, next) => {
        try {
          const { params: { id }, body: { position }, file } = req
          /** 
           * recup "file:object" & "position:array"
           * poste les image depuis "file"
           * faire correspondre les url recuperer avec les position
           * get les "images" existante en DB
           * boucler
           *    splice l'url a la position voulu 
           * enregister en DB le nouveau tableau
           * return le nouveau tableau
           */



          // const { params: { id }, body: { position: positionString }, files } = req
          // const positionArray = positionString.split(',')
          // for (let i = 0; i < positionArray.length; i++) {
          //   newUrls.push({
          //     newImage: files.newImages[i],
          //     position: +positionArray[i]
          //   })
          // }
          // newUrls.sort((elA, elB) => {
          //   if (elA.position > elB.position) return -1
          //   if (elA.position < elB.position) return 1
          //   return 0
          // })

          let newUrls = [file]
          let vinylFound = await Vinyl.findByPk(id, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });
          let dbVinylImage = vinylFound.images
            ? vinylFound.images.map(el => el.replace(/^\/images?\/(.+)$/, `$1`))
            : []

          if (Array.isArray(vinylFound.images) && position > vinylFound.images.length + 1)
            throw { name: 'VinymaticApiPositionNotExist' }

          /** IMAGES */
          // for (const newUrl of newUrls) {
          // const { newImage: img, position } = newUrl
          for (const img of newUrls) {
            let i = 0
            const path = `vinyls/larges/${vinylFound.title}_${vinylFound.id}I${Date.now()}D${position}P.jpg`

            const bucketS3Service = new BucketS3Service('image')
            const uploadResult = await bucketS3Service.uploadFile(path, img)
            await unlinkFile(img.path)

            // newUrl.push(`/image/${uploadResult.Key}`)
            const toModif = dbVinylImage.splice((position - 1))
            dbVinylImage.push(uploadResult.Key)
            // const { idToChange } = toModif[0].match(/(?<idToChange>\d+)P\.jpe?g$/).groups
            let newPosition = +position + 1
            for (let imgToModif of toModif) {
              const newName = imgToModif.replace(/^(.+D)\d+(P\.jpe?g)$/, `$1${newPosition}$2`)
              if (imgToModif.localeCompare(newName) != 0)
                await bucketS3Service.renameFile(imgToModif, newName)
              dbVinylImage.push(newName)
              newPosition++
            }
            // dbVinylImage = [...dbVinylImage, ...toModif]
            i++
          }
          /** IMAGES */

          const newdbVinylImage = dbVinylImage.map(el => `/image/${el}`)
          // console.log(dbVinylImage)
          await vinylFound.update({
            images: newdbVinylImage
          })

          vinylFound = await Vinyl.findByPk(id, { attributes: { exclude: ["serie"] } });

          res.status(201).json({ vinyl: vinylFound })
        } catch (err) {
          if (/VinymaticApiPositionNotExist/.test(err.name))
            return res.status(400).json(err)

          if (err.statusCode === 400)
            return res.status(400).json({ message: err.code })

          if (err.statusCode === 404)
            return res.status(404).json({ message: err.message.replace(/key/, 'file') })


          res.status(500).json({ msg: 'Internal Error' })
        }
      })
    .delete(
      async (req, res, next) => {
        try {
          const { params: { id }, body } = req
          let { imageToSave, imageToDelete } = body

          const bucketS3Service = new BucketS3Service('image')

          let vinylFound = await Vinyl.findByPk(id, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          if ((imageToSave.length + imageToDelete.length) !== vinylFound.images.length) throw { name: 'VinymaticApiLengthDbImageAndLengthDeleteImageAreNotEqual' }

          imageToSave = imageToSave.map(el => el.replace(/^\/images?\/(.+)$/, `$1`))
          imageToDelete = imageToDelete.map(el => el.replace(/^\/images?\/(.+)$/, `$1`))

          for (let img of imageToDelete) {
            await bucketS3Service.deleteFile(img)
          }

          let newPosition = 1
          imageToSave = await Promise.all(imageToSave.map(async img => {
            const newName = img.replace(/^(.+D)\d+(P\.jpe?g)$/, `$1${newPosition}$2`)
            newPosition++
            if (img.localeCompare(newName) != 0)
              await bucketS3Service.renameFile(img, newName)
            return `/image/${newName}`
          }))

          await vinylFound.update({ images: imageToSave })

          res.status(204).json({})
        } catch (err) {
          if (/VinymaticApiLengthDbImageAndLengthDeleteImageAreNotEqual/.test(err.name))
            return res.status(400).json(err);

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          if (err.statusCode === 404)
            return res.status(404).json({ message: err.message.replace(/key/, 'file') })

          res.status(500).json({ msg: 'Internal Error' })
        }
      })


  router.route('/vinyl/:id/discography')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params } = req
          const { id } = params

          const options = {
            attributes: ["id", "title", "thumbnail", "releaseDate", "country"],
            include: [
              { model: Artist, as: "VinylMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Label, as: "VinylLabels", attributes: ["id", "idLabel", "name", "thumbnail"], through: { attributes: ["catno"] } },
            ],
            rejectOnEmpty: true
          }

          const vinylFound = await Vinyl.findByPk(id, options);

          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: `${TOKEN_API}` })
          const vinylFormatGetted = (await as.doRequest('get', `/vinyl/${id}/formats`)).data


          vinylFound.dataValues = {
            ...vinylFound.dataValues,
            Formats: vinylFormatGetted.formats,
          }

          req.results = { vinyl: vinylFound }
          next()

        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}




/**
 * {
  "imageToSave": [
      "/image/vinyls/larges/Rapattitude!_2I1648143492360D2P.jpg",
      "/image/vinyls/larges/Rapattitude!_2I1648143493566D3P.jpg"
    ],
  "imageToDelete": [
    "/image/vinyls/larges/Rapattitude!_2I1655306760730D1P.jpg"
  ]
}
 */