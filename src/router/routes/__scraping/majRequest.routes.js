// const { URL_API, PORT_API, TOKEN_API } = process.env

// const { ValidationError, UniqueConstraintError } = require('sequelize')
const { fork } = require('child_process');

// const ApiService = require('../../services/apiService')
const Models = { Artist, Vinyl, Audio } = require('../../../db/models')
const { haveYouThePermission } = require('../../../auth/accessControl')
const Tools = require('../../../tools/tools')
// const imageTools = require('../../tools/images.tool')
const imageManagmentCall = require('../../../tools/imageManagmentCall.tool');
const { release } = require('os');


const getDataFromScraping = (entity, idEntity, options = {}) => {
  return new Promise((resolve, reject) => {
    const child = fork(`../scraping/index.js`, ['-m 1', '-r true', `-e ${entity}`, `-I ${idEntity}`,])
    child.on('message', (msg) => {
      switch (true) {
        case /^\s?(?:vinyl|release|master|artist|label)::/i.test(msg):
          const [, data] = msg.split('::')
          resolve(JSON.parse(data))
        //case /^\s?vinylTrack::/i.test(msg):  
        default: reject(); break;
      }
    })
    child.on('error', (error) => {
      reject(error)
    })
  })
}

module.exports = (router) => {
  router.route('/maj/vinyls/tracks')
    .patch(
      //haveYouThePermission('updateAny', 'scraping'),
      async (req, res, next) => {
        try {
          const { query: { idEntity } } = req
          const vinyl = await getDataFromScraping('release', idEntity)
          const vinylFound = await Vinyl.findOne({ where: { idRelease: vinyl.idRelease } })

          let entityObject = null
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
              track.image = vinylFound.thumbnail
              const audioCreated = await vinylFound.createAudio(track)

              /** Main Artist */
              for (const a of track.artists) {
                const artistFound = await Artist.findOne({ where: { idArtist: a.idArtist } })
                if (artistFound !== null) artistFound.addAudioMainArtist(audioCreated)
              }

              /** Credit */
              if (track.credits && Array.isArray(track.credits)) {
                for (const c of track.credits) {
                  const artistFound = await Artist.findOne({ where: { idArtist: c.creditArtistId } })
                  if (artistFound !== null) await artistFound.addAudioCredit(audioCreated, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
                  else await audioCreated.createAudioCredit({ idArtist: c.creditArtistId }, { through: { roleCredit: c.creditRole, typeCredit: 'AUDIO_CREDIT' } })
                }
              }
            }
            console.log(`Tracks Changed !!`)
          }

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
            where: { idRelease: idEntity },
            rejectOnEmpty: true
          }
          const itemFound = await Vinyl.findOne(options)

          req.results = { tracklist: itemFound.Audios }
          console.log(`-----------------------`)

          next()
          // res.status(200).json({ vinyl: itemFound })
        } catch (error) {
          res.status(500).json(error)
        }
      })

  router.route('/maj/:entity/images')
    .patch(
      haveYouThePermission('updateAny', 'scraping'),
      async (req, res, next) => {
        try {
          const { params: { entity: entitySelect }, query: { idEntity } } = req
          const entity = await getDataFromScraping(entitySelect, idEntity)
          const dbItem = await Models[Tools.capitelize(/release/i.test(entitySelect) ? 'vinyl' : entitySelect)].findOne({ where: { idRelease: entity.idRelease } })

          /** IMAGES */
          const allImages = await imageManagmentCall(null, entity, {
            dbItem,
            imageFrom: /release/i.test(entitySelect) ? 'vinyl' : entitySelect
          })
          /** IMAGES */

          await dbItem.update(allImages)
          const itemFound = await Vinyl.findByPk(dbItem.id, { attributes: { exclude: ["serie"] }, rejectOnEmpty: true });

          res.status(200).json({ vinyl: itemFound })
        } catch (error) {
          res.status(500).json(error)
        }

      })

}

