const multer = require('multer')

const Tools = require('../../../tools/tools')

const Models = require('./../../../db/models')
const { haveYouThePermission } = require('../../../auth/accessControl')

const upload = multer({ dest: './src/files/uploads' })
const imageManagmentCall = require('../../../tools/imageManagmentCall.tool')
const { classify } = require('inflection')


module.exports = (router) => {
  router.route('/s/:entity')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          let { params: { entity } } = req

          const id_ = /(vinyl)|(release)/i.test(entity)
            ? [`idRelease`]
            : [`id${classify(entity)}`]

          let where = {
            [Op.and]: [
              { [id_]: { [Op.not]: null } },
              {
                thumbnail: {
                  [Op.or]: [
                    {
                      [Op.and]: [
                        { [Op.is]: null },
                      ]
                    },
                    { [Op.substring]: '%discogs%' },
                  ]
                }
              },
              {
                images: {
                  [Op.or]: [
                    {
                      [Op.and]: [
                        { [Op.is]: null },
                      ]
                    },
                    { [Op.substring]: '%discogs%' },
                  ]
                }
              },
            ]
          }



          const options = {
            order: [['id', 'ASC']]
          }
          options.where = { ...where, ...options.where }

          const entityFound = await Models[classify(entity)].findAll(options)
          res.status(200).json({ [`${entity}s`]: entityFound })
        } catch (err) {
          return res.status(500).json({ message: 'InternalError' })
        }
      })
  router.route('/s/vinyl/:id')
    .patch(
      haveYouThePermission('updateOwn', 'vinyl'),
      upload.fields([{ name: 'thumbnail' }, { name: 'images' }]),
      async (req, res, next) => {
        try {
          const othersToUpdate = {}
          const { body, params: { id }, files } = req
          const vinyl = { artists, styles, genre, label, format } = body
          let vinylFound = await Models.Vinyl.findByPk(id, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

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
              await Models.Audio.destroy({ where: { id: eOld.id } })
            }

            for (const track of entityObject.new) {
              track.image = othersToUpdate.thumbnail
              const audioCreated = await vinylFound.createAudio(track)

              /** Main Artist */
              for (const a of track.artists) {
                const artistFound = await Models.Artist.findOne({ where: { idArtist: a.idArtist } })
                if (artistFound !== null) artistFound.addAudioMainArtist(audioCreated)
              }

              /** Credit */
              if (track.credits && Array.isArray(track.credits)) {
                for (const c of track.credits) {
                  const artistFound = await Models.Artist.findOne({ where: { idArtist: c.creditArtistId } })
                  if (artistFound !== null) await artistFound.addAudioCredit(audioCreated, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
                  else await audioCreated.createAudioCredit({ idArtist: c.creditArtistId }, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
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
          vinylFound = await Models.Vinyl.findByPk(id, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          console.log(`VINYL  CHANGED !!`)
          console.log(`-----------------`)
          res.status(200).json({ vinyl: vinylFound })

        } catch (err) {
          if (/VinymaticApiNoModification/.test(err.name))
            return res.status(304).json({ message: "Aucune modification apporter" })

          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: 'AlreadyExist' });

          if (
            /VinymaticApiLengthDbImageAndLengthPatchImageAreNotEqual/.test(err.name) ||
            /VinymaticApiSameUrlImage/.test(err.name)
          )
            return res.status(400).json(err);

          if (err.statusCode === 404)
            return res.status(404).json({ message: err.message.replace(/key/, 'file') })

          if (/SequelizeEmptyResultError/.test(err.name))
            return res.status(404).json({ message: 'EmptyResultError' })

          return res.status(500).json({ message: 'InternalError' })
        }
      })
}