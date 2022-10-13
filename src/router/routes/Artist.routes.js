
const { Artist, Master, Vinyl, Audio, FormatInVinyl, Format, FormatDescription, FormatSide, FormatSize, FormatSpeed, FormatVoice } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const Tools = require('../../tools/tools')
const imageTools = require('../../tools/images.tool')
const imageManagmentCall = require('../../tools/imageManagmentCall.tool')
const includeEntity = require('../relations/includeEntity')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const { haveYouThePermission } = require('../../auth/accessControl')
const Op = require('sequelize').Op;

const { URL_API, PORT_API, TOKEN_API } = process.env
const ApiService = require('../../services/apiService')


const multer = require('multer')
const upload = multer({ dest: './src/files/uploads' })

const { addFormat } = require('../../tools/format.tool')



module.exports = (router) => {
  router.route('/artists')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req;
          // let { isForScrapingMaj, isErreurScraping } = query;

          // isErreurScraping = isErreurScraping == 'true' ? true : false
          // isForScrapingMaj = isForScrapingMaj == 'true' ? true : false


          // const pagination = Tools.pagination(query);
          // const filter = Tools.filter(query, { entity: 'artist' });
          // const includes = {
          //   ...includeEntity.routes.artist.gets,
          //   include: filter.include
          // }
          // if (query && query.getIdLabel) includes.attributes = ['idArtist']
          // const options = {
          //   ...includes,
          //   ...pagination,
          //   ...filter
          // };

          let where = {}
          // if (isForScrapingMaj) {
          //   where = {
          //     [Op.and]: [
          //       { idArtist: { [Op.not]: null } },
          //       {
          //         thumbnail: {
          //           [Op.or]: [
          //             { [Op.is]: null },
          //             { [Op.substring]: '%discogs%' }
          //           ]
          //         }
          //       },
          //       {
          //         images: {
          //           [Op.or]: [
          //             { [Op.is]: null },
          //             { [Op.substring]: '%discogs%' }
          //           ]
          //         }
          //       },
          //     ]
          //   }

          // } else if (isErreurScraping) {
          //   where = {
          //     [Op.and]: [{ idArtist: { [Op.is]: null } }]
          //   }
          // } else {
          //   where = {
          //     [Op.and]: [
          //       { idArtist: { [Op.not]: null } },
          //       {
          //         thumbnail: {
          //           [Op.and]: [
          //             { [Op.not]: null },
          //             { [Op.notLike]: '%discogs%' }
          //           ]
          //         }
          //       },
          //       {
          //         images: {
          //           [Op.and]: [
          //             { [Op.not]: null },
          //             { [Op.notLike]: '%discogs%' }
          //           ]
          //         }
          //       },
          //     ]
          //   }
          // }

          const filter = Tools.filter(query, { entity: 'artist' });
          const paginations = Tools.pagination(query);
          const includes = {
            ...includeEntity.routes.artist.gets,
            include: filter.include
          }
          if (query && query.getIdLabel) includes.attributes = ['idArtist']

          const options = {
            ...includes,
            ...paginations,
            ...filter
          }

          options.where = { ...where, ...options.where }

          const artists = await Artist.findAll(options)
          res.status(200).json({ artists })
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createAny', 'all'),
      async (req, res, next) => {
        try {
          const { body, files } = req
          const artist = body
          const artistCreated = await Artist.create(body)

          if (files || (artist && (artist.thumbnail === '' || artist.images === ''))) {
            if ((files && files.thumbnail) || artist.thumbnail === '') {
              const options = imageTools.getOptionForuploadImageFile(files.thumbnail, 'artist', artistCreated, artist)
              const artistImage = await imageTools.uploadImageFile(options)
              await artistCreated.update(artistImage)
            }

            if (files.images || artist.images === '') {
              const ImageService = require('./../../services/imageService')
              const is = new ImageService(files.images)
              const artistImage = await is.uploadArrayImageFiles({ imageFrom: 'artist', typeImage: 'large', itemDb: artistCreated, itemAd: artist })
              await artistCreated.update(artistImage)
            }
          } else {
            if (artist.thumbnail) {
              if (!artistCreated.thumbnail || /discogs/i.test(artistCreated.thumbnail)) {
                /** TODO = imageFrom: "test" => "artist" */
                const resImage = await imageTools.getImageUrl(artist.thumbnail, { imageFrom: 'artist', typeImage: 'thumbnail', id_: artistCreated.id, name: artist.title })
                const { data: { url } } = resImage
                othersToUpdate.thumbnail = url.url;
              }
            }

            if (artist.images) {
              if ((artistCreated.images && artistCreated.images.length === 0) || artistCreated.images === null || /discogs/i.test(artistCreated.images[0])) {
                const largeImages = [];
                let positionImage = 1
                for (const image of artist.images) {
                  /** TODO = imageFrom: "test" => "artist" */
                  const resImage = await imageTools.getImageUrl(image, { imageFrom: 'artist', typeImage: 'large', id_: artistCreated.id, name: artist.title, positionImage })
                  const { data: { url } } = resImage
                  largeImages.push(url.url)
                  positionImage += 1
                }
                othersToUpdate.images = largeImages;
              }
            }
          }

          const options = {
            attributes: ["id", "idArtist", "name", "fullName", "aliasNames", "variantNames", "description", "inGroups", "thumbnail", "images", "artistUrl", "resourceUrl"],
            include: [
              { model: Master, as: "MasterMainArtists", attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Vinyl, as: "VinylMainArtists", attributes: ["id", "idRelease", "title", "country", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Master, as: "MasterCredits", attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"], through: { attributes: ["roleCredit", "typeCredit"] } },
              { model: Vinyl, as: "VinylCredits", attributes: ["id", "idRelease", "title", "country", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: ["roleCredit", "typeCredit"] } },
              { model: Audio, attributes: ["id", "title", "position", "duration", "type", "credits", "audioUrl"] },
            ],
          }
          const artistFound = await Artist.findByPk(artistCreated.id, options)

          res.status(201).json({ artist: artistFound })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })



  /** ITEMS OPPERATION */
  router.route('/artists/search')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req
          const { withCol = null } = query
          if (!withCol || (withCol && (!withCol.field || !withCol.value))) throw { name: "VinymatiApiNoCriteriaError" }

          const withColObject = Tools.getWithColAsArray(withCol)
          const whereClause = withColObject.map(({ field, value }) => Tools.autocomplete(field, value))

          const options = { attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"] }
          options.where = whereClause

          const artistFound = await Artist.findAll(options)

          res.status(200).json({ artists: artistFound })
        } catch (err) {
          if (err.name.localeCompare(NO_CRITRIA_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });


          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
  // router.route('/artist/name/:nameArtist')
  //   .get(
  //     haveYouThePermission('readAny', 'all'),
  //     async (req, res, next) => {
  //       try {
  //         const { nameArtist } = req.params;
  //         const options = {
  //           where: Tools.autocomplete('name', nameArtist),
  //           ...includeEntity.routes.artist.get
  //         }
  //         const artist = await Artist.findAll(options)
  //         if (artist == null)
  //           return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

  //         res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200), data: artist })
  //       } catch (err) {
  //         res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
  //       }

  //     })
  router.route('/artist/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { id } = req.params
          const options = {
            attributes: ["id", "idArtist", "name", "fullName", "aliasNames", "variantNames", "description", "inGroups", "thumbnail", "images", "artistUrl", "resourceUrl"],
            include: [
              { model: Master, as: "MasterMainArtists", attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Vinyl, as: "VinylMainArtists", attributes: ["id", "idRelease", "title", "country", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Audio, as: "AudioMainArtists", attributes: ["id", "title", "position", "duration", "type", "credits", "audioUrl"] },
              { model: Master, as: "MasterCredits", attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl", "resourceUrl"], through: { attributes: ["roleCredit", "typeCredit"] } },
              { model: Vinyl, as: "VinylCredits", attributes: ["id", "idRelease", "title", "country", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"], through: { attributes: ["roleCredit", "typeCredit"] } },
              { model: Audio, as: "AudioCredits", attributes: ["id", "title", "position", "duration", "type", "credits", "audioUrl"] },
            ],
          }
          const artist = await Artist.findByPk(id, { ...options, rejectOnEmpty: true })
          req.results = { artist }

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
          const { body: artist, params, files } = req
          const { id } = params

          let artistFound = await Artist.findByPk(id, { rejectOnEmpty: true })

          /** IMAGES */
          const allImages = await imageManagmentCall(files, artist, {
            dbItem: artistFound,
            imageFrom: 'artist'
          })

          othersToUpdate.thumbnail = allImages.thumbnail;
          othersToUpdate.images = allImages.images;
          /** IMAGES */

          // if (files || (artist && (artist.thumbnail === '' || artist.images === ''))) {
          //   if ((files && files.thumbnail) || artist.thumbnail === '') {
          //     const options = imageTools.getOptionForuploadImageFile(files.thumbnail, 'artist', artistFound, artist)
          //     const artistImage = await imageTools.uploadImageFile(options)
          //     await artistFound.update(artistImage)
          //   }

          //   if (files.images || artist.images === '') {
          //     const ImageService = require('./../../services/imageService')
          //     const is = new ImageService(files.images)
          //     const artistImage = await is.uploadArrayImageFiles({ imageFrom: 'artist', typeImage: 'images', itemDb: artistFound, itemAd: artist })
          //     await artistFound.update(artistImage)
          //   }

          // } else {
          //   if (artist.thumbnail) {
          //     if (!artistFound.thumbnail || /discogs/i.test(artistFound.thumbnail)) {
          //       /** TODO = imageFrom: "test" => "artist" */
          //       const resImage = await imageTools.getImageUrl(artist.thumbnail, { imageFrom: 'artist', typeImage: 'thumbnail', id_: artistFound.id, name: artist.name })
          //       const { data: { url } } = resImage
          //       artist.thumbnail = url.url;
          //       othersToUpdate.thumbnail = artist.thumbnail;
          //     }
          //   }

          //   if (artist.images) {
          //     if ((artistFound.images && artistFound.images.length === 0) || artistFound.images === null || /discogs/i.test(artistFound.images[0])) {
          //       const largeImages = [];
          //       let positionImage = 1
          //       for (const image of artist.images) {
          //         /** TODO = imageFrom: "test" => "artist" */
          //         const resImage = await imageTools.getImageUrl(image, { imageFrom: 'artist', typeImage: 'large', id_: artistFound.id, name: artist.name, positionImage })
          //         const { data: { url } } = resImage
          //         largeImages.push(url.url)
          //         positionImage += 1
          //       }
          //       artist.images = largeImages;
          //       othersToUpdate.images = artist.images;
          //     }
          //   }
          // }


          if (artist.name) othersToUpdate.name = artist.name;
          if (artist.fullname) othersToUpdate.fullname = artist.fullname;
          if (artist.aliasNames) othersToUpdate.aliasNames = artist.aliasNames;
          if (artist.variantNames) othersToUpdate.variantNames = artist.variantNames;
          if (artist.description) othersToUpdate.description = artist.description;
          if (artist.inGroups) othersToUpdate.inGroups = artist.inGroups;

          await artistFound.update(othersToUpdate)
          artistFound = await Artist.findByPk(id, { rejectOnEmpty: true })
          res.status(200).json({ artist: artistFound })
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

  router.route('/artist/idArtist/:idArtist')
    .patch(
      haveYouThePermission('updateAny', 'all'),
      async (req, res, next) => {
        try {
          const { body: artist, params } = req
          const { idArtist } = params
          let artistFound = await Artist.findOne({ attributes: ["id"], where: { idArtist }, rejectOnEmpty: true });


          const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
          const resPatchArtist = await as.doRequest('PATCH', `/artist/${artistFound.id}`, artist)

          // if (files || (artist && (artist.thumbnail === '' || artist.images === ''))) {
          //   if ((files && files.thumbnail) || artist.thumbnail === '') {
          //     const options = imageTools.getOptionForuploadImageFile(files.thumbnail, 'artist', artistFound, artist)
          //     const artistImage = await imageTools.uploadImageFile(options)
          //     await artistFound.update(artistImage)
          //   }

          //   if (files.images || artist.images === '') {
          //     const ImageService = require('./../../services/imageService')
          //     const is = new ImageService(files.images)
          //     const artistImage = await is.uploadArrayImageFiles({ imageFrom: 'artist', typeImage: 'images', itemDb: artistFound, itemAd: artist })
          //     await artistFound.update(artistImage)
          //   }

          // } else {
          //   if (artist.thumbnail) {
          //     if (!artistFound.thumbnail || /discogs/i.test(artistFound.thumbnail)) {
          //       /** TODO = imageFrom: "test" => "artist" */
          //       const resImage = await imageTools.getImageUrl(artist.thumbnail, { imageFrom: 'artist', typeImage: 'thumbnail', id_: artistFound.id, name: artist.name })
          //       const { data: { url } } = resImage
          //       artist.thumbnail = url.url;
          //     }
          //   }

          //   if (artist.images) {
          //     if ((artistFound.images && artistFound.images.length === 0) || artistFound.images === null || /discogs/i.test(artistFound.images[0])) {
          //       const largeImages = [];
          //       let positionImage = 1
          //       for (const image of artist.images) {
          //         /** TODO = imageFrom: "test" => "artist" */
          //         const resImage = await imageTools.getImageUrl(image, { imageFrom: 'artist', typeImage: 'large', id_: artistFound.id, name: artist.name, positionImage })
          //         const { data: { url } } = resImage
          //         largeImages.push(url.url)
          //         positionImage += 1
          //       }
          //       artist.images = largeImages;
          //     }
          //   }
          // }

          // await artistFound.update(artist)
          // artistFound = await Artist.findOne({ where: { idArtist } });
          // console.log(`ARTIST  CHANGED !!`)
          // console.log(`-----------------`)
          // res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { updatedRessource: true }), artist: resPatchArtist.data.artist })
          res.status(200).json({ artist: resPatchArtist.data.artist })
        } catch (err) {
          // if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
          //   const response = res.status(400)
          //   const responseObject = { message: ErrorMessage.getMessageByStatusCode(400, { entity: 'artist' }) }
          //   next({ ...responseObject, resourceObject: { entity: 'artist' } })
          //   return response.json(responseObject)
          // }
          if (/SequelizeEmptyResultError/.test(err.name))
            return res.status(404).json({ message: 'NotFound' })

          res.status(500).json({ message: 'Internal Error' })
          // next(err)
        }
      })


  router.route('/artist/:id/discography')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params: { id }, query: { counting, groupBy } } = req

          const countingBoolean = counting ? Tools.isBooleanFromString(counting) : null


          const options = { attributes: ["id"] }
          const artist = await Artist.findByPk(id, { ...options, rejectOnEmpty: true })



          let grouping = null
          switch (true) {
            case /^albums$/.test(groupBy): grouping = ['album', 'lp', 'mini album']; break;
            case /^singles$/.test(groupBy): grouping = ['ep', 'maxi single', 'single']; break;
            case /^compilations$/.test(groupBy): grouping = ['compilation']; break;
            default: throw { name: 'VinymaticApiInvalidQuery:InvalidGroupBy' }
          }

          const optionsVinyl = {
            attributes: ["id", "idRelease", "title", "country", "releaseDate", "thumbnail", "vinylUrl", "resourceUrl"],
          }

          let discographies = await artist.getVinylMainArtists(optionsVinyl)
          discographies = (await Promise.all(
            discographies.map(async el => {
              const c = await el.countFormatInVinyls({
                include: [
                  {
                    model: FormatDescription,
                    attributes: { exclude: ["id", "name"] },
                    where: {
                      name: {
                        [Op.in]: grouping
                      }
                    },
                    through: { attributes: [] }
                  }
                ]
              })
              return c > 0 ? el : null
            })
          )).filter(el => !!el)

          req.results = countingBoolean
            ? { discographiesCount: await artist.countVinylMainArtists() }
            : { discographies }

          next()
        } catch (err) {
          if (err.name.localeCompare('VinymaticApiInvalidQuery:InvalidGroupBy') === 0)
            return res.status(400).json({ message: 'VinymaticApiInvalidQuery:InvalidGroupBy' })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          // if (err.name.localeCompare('SequelizeErrorsDatabaseError') === 0)
          //   return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })

  router.route('/artist/:id/followers')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { id } = req.params

          const artist = await Artist.findByPk(id)

          const followers = await artist.getUsers()

          console.log(followers)
          req.results = { artistFollowers: followers }

          next()
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })
}

