const tracklistTool = require('../tools/tracklist.tool')
const tools = require('./../tools/tools')

module.exports = async (req, res, next) => {
  /** STATUS: 2xx */
  const { method, results } = req

  /** DATA MANIPULATION */
  if (results) {
    let dataValues = null
    if (results.tracklist) {
      results.tracklist = results.tracklist.map((t) => {
        const track = t
        track.AudioCredits = track.AudioCredits.map(c => {
          const credit = c
          credit.dataValues.roleCredit = credit.dataValues.CreditsInAudios.dataValues.roleCredit.split(/,\s?/)
          credit.dataValues.typeCredit = credit.dataValues.CreditsInAudios.dataValues.typeCredit
          delete credit.dataValues.CreditsInAudios
          return credit
        })
        return track
      })
      const finalTracklist = tracklistTool.getTracklist(results.tracklist)
      results.tracklist = finalTracklist
    } else {
      for (const entity of Object.keys(results)) {
        if (Array.isArray(results[entity])) {
          /** TODO: Manipulation Array of vinyls from Collection/Wishlist */
          if (/format/i.test(entity)) {
            // for (const f of results[entity]) {
            results[entity] = results[entity].map(f => {
              dataValues = f.dataValues
              dataValues.name = dataValues.Format ? dataValues.Format.dataValues.name : null
              dataValues.side = dataValues.FormatSide ? dataValues.FormatSide.dataValues.name : null
              dataValues.size = dataValues.FormatSize ? dataValues.FormatSize.dataValues.name : null
              dataValues.speed = dataValues.FormatSpeed ? dataValues.FormatSpeed.dataValues.name : null
              dataValues.voice = dataValues.FormatVoice ? dataValues.FormatVoice.dataValues.name : null
              dataValues.descriptions = dataValues.FormatDescriptions.map(el => el.name)

              delete dataValues.Format
              delete dataValues.FormatDescriptions
              delete dataValues.FormatSide
              delete dataValues.FormatSize
              delete dataValues.FormatSpeed
              delete dataValues.FormatVoice
              return f
            })
          }
        } else if (typeof results[entity] === 'object' && !Array.isArray(results[entity])) {
          dataValues = results[entity].dataValues
          if (/audio/i.test(entity)) {
            dataValues.AudioCredits = dataValues.AudioCredits.map((el) => {
              const credit = el
              credit.dataValues.roleCredit = credit.dataValues.CreditsInAudios.dataValues.roleCredit
              credit.dataValues.typeCredit = credit.dataValues.CreditsInAudios.dataValues.typeCredit
              delete credit.dataValues.CreditsInAudios
              return credit
            })
          }

          if (/vinyl|artist/i.test(entity)) {
            if (dataValues.VinylCredits) {
              dataValues.VinylCredits = dataValues.VinylCredits.map((el) => {
                const credit = el
                credit.dataValues.roleCredit = credit.dataValues.CreditsInVinyl.dataValues.roleCredit
                credit.dataValues.typeCredit = credit.dataValues.CreditsInVinyl.dataValues.typeCredit
                delete credit.dataValues.CreditsInVinyl
                return credit
              })
            }
          }

          if (/vinyl|label/i.test(entity)) {
            if (dataValues.VinylLabels) {
              dataValues.VinylLabels = dataValues.VinylLabels.map((el) => {
                const label = el
                label.dataValues.catno = label.dataValues.LabelsInVinyl.dataValues.catno
                delete label.dataValues.LabelsInVinyl
                return label
              })
            }


            if (dataValues.VinylSocietes) {
              dataValues.VinylSocietes = dataValues.VinylSocietes.map((el) => {
                const label = el
                label.dataValues.roleSociete = label.dataValues.SocietesInVinyl.dataValues.roleSociete
                label.dataValues.typeSociete = label.dataValues.SocietesInVinyl.dataValues.typeSociete
                delete label.dataValues.SocietesInVinyl
                return label
              })
            }


            if (dataValues.VinylSeries) {
              dataValues.VinylSeries = dataValues.VinylSeries.map((el) => {
                const label = el
                label.dataValues.catno = label.dataValues.Series.dataValues.catno
                delete label.dataValues.Series
                return label
              })
            }
          }

          if (/playlist/i.test(entity)) {
            dataValues.Audios = dataValues.Audios.map((el) => {
              const audio = el
              audio.dataValues.position = audio.dataValues.AudiosInPlaylist.dataValues.position
              delete audio.dataValues.AudiosInPlaylist
              return audio
            })

            // dataValues.Audios = dataValues.Audios.sort((elA, elB) => {
            // if (elA.position > elB.position) return 1
            // if (elA.position < elB.position) return -1
            // if (elA.position == elB.position) return 0
            // })
          }



          if (/collection|wishlist/i.test(entity)) {
            const { page, limit } = req.query
            const pagination = tools.pagination({ page, limit })
            dataValues.Vinyls = dataValues.Vinyls.slice(pagination.offset, (pagination.offset + pagination.limit))
          }



          /* if (/collection/i.test(entity)) {
            dataValues.Vinyls = dataValues.Vinyls.map((el) => {
              const vinyl = el
              vinyl.dataValues.diskCondition = vinyl.dataValues.VinylsInCollection.dataValues.diskCondition
              vinyl.dataValues.coverCondition = vinyl.dataValues.VinylsInCollection.dataValues.coverCondition
              delete vinyl.dataValues.VinylsInCollection
              return vinyl
            })
          }

          if (/wishlist/i.test(entity)) {
            dataValues.Vinyls = dataValues.Vinyls.map((el) => {
              const vinyl = el
              vinyl.dataValues.diskCondition = vinyl.dataValues.VinylsInWishlist.dataValues.diskCondition
              vinyl.dataValues.coverCondition = vinyl.dataValues.VinylsInWishlist.dataValues.coverCondition
              delete vinyl.dataValues.VinylsInWishlist
              return vinyl
            })
          } */


          if (/master|artist/i.test(entity)) {
            dataValues.MasterCredits = dataValues.MasterCredits.map((el) => {
              const credit = el
              credit.dataValues.roleCredit = credit.dataValues.CreditsInMaster.dataValues.roleCredit
              credit.dataValues.typeCredit = credit.dataValues.CreditsInMaster.dataValues.typeCredit
              delete credit.dataValues.CreditsInMaster
              return credit
            })
          }

          results[entity].dataValues = dataValues
        }
      }
    }
  }
  /** ***************** */



  switch (true) {
    case /^get|patch$/i.test(method):
      res.status(200).json({ ...results })
      break;
    case /^post$/i.test(method):
      res.status(201).json({ ...results })
      break;
    case /^delete$/i.test(method):
      res.status(204).json({})
      break;
    default: break;
  }
}