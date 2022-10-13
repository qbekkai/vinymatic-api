const Models = require('../../../db/models')

module.exports = (router) => {
  router.route('/s/maj/vinyl')
    .patch(
      async (req, res, next) => {
        try {
          const { body: vinyl } = req
          vinyl.idRelease = vinyl.idRelease && typeof vinyl.idRelease === 'string'
            ? +(vinyl.idRelease)
            : vinyl.idRelease


          let vinylFound = await Models.Vinyl.findOne({ where: { idRelease: vinyl.idRelease }, rejectOnEmpty: true })
          await vinylFound.update({
            title: vinyl.title,
            country: vinyl.country,
            releaseDate: vinyl.releaseDate,
          })


          let entityObject = {};
          for (const [key, values] of Object.entries(vinyl)) {
            switch (true) {
              case (values && /identifiers/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound.getIdentifiers(),
                  new: vinyl.identifiers
                };

                for (const eOld of entityObject.old) await vinylFound.removeIdentifier(eOld)
                for (const eNew of entityObject.new) {
                  const toUpdate = await Models.Identifier.findOne({ where: eNew });
                  if (toUpdate !== null) await vinylFound.addIdentifier(toUpdate)
                  else await vinylFound.createIdentifier(eNew)
                }

                console.log(`     IDENTIFIERS UPDATED !!`)
                break;
              case (values && /tracklist/i.test(key) && values.length !== 0):
                entityObject = {
                  old: await vinylFound.getAudios(),
                  new: vinyl.tracklist
                };

                for (const eOld of entityObject.old) {
                  await vinylFound.removeAudio(eOld)
                  await Audio.destroy({ where: { id: eOld.id } })
                }

                for (const track of entityObject.new) {
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

                console.log(`     TRACKS UPDATED !!`)
                break;
            }
          }

          vinylFound = await Models.Vinyl.findByPk(vinylFound.id)
          console.log(`VINYL UPDATED BY SCRAPING !! ( idRelease: ${vinylFound.idRelease})`)
          console.log(`------------------------------`)


          res.status(200).json({ vinyl: vinylFound })
        } catch (err) {
          if (/SequelizeUniqueConstraintError/i.test(err.name))
            return res.status(400).json({ message: `Vinyl (idRelease: ${err.fields.idRelease}) already exist` })

          res.status(500).json({ message: 'InternalError' })
        }
      })

  router.route('/s/maj/label')
    .patch(async (req, res, next) => {
      try {
        const { body: label } = req
        label.idLabel = label.idLabel && typeof label.idLabel === 'string'
          ? +(label.idLabel)
          : label.idLabel


        let labelFound = await Models.Label.findOne({ where: { idLabel: label.idLabel }, rejectOnEmpty: true })

        // Images
        // const allImages = await imageManagmentCall(null, label, {
        //   dbItem: labelFound,
        //   imageFrom: 'label'
        // })

        await labelFound.update({
          name: label.name,
          thumbnail: null,
          images: null
          // thumbnail: allImages.thumbnail,
          // images: allImages.images
        })


        labelFound = await Models.Label.findByPk(labelFound.id)
        console.log(`LABEL UPDATED BY SCRAPING !! ( idLabel: ${labelFound.idLabel})`)
        console.log(`------------------------------`)


        res.status(200).json({ label: labelFound })
      } catch (err) {
        if (/SequelizeUniqueConstraintError/i.test(err.name))
          return res.status(400).json({ message: `Label (idLabel: ${err.fields.idLabel}) already exist` })

        res.status(500).json({ message: 'InternalError' })
      }
    })

  router.route('/s/maj/artist')
    .patch(async (req, res, next) => {
      try {
        const { body: artist } = req
        artist.idArtist = artist.idArtist && typeof artist.idArtist === 'string'
          ? +(artist.idArtist)
          : artist.idArtist

        let artistFound = await Models.Artist.findOne({ where: { idArtist: artist.idArtist }, rejectOnEmpty: true })
        await artistFound.update({
          name: artist.name,
          fullName: artist.fullName,
          description: artist.description,
          aliasNames: artist.aliasNames,
          inGroups: artist.inGroups,
          variantNames: artist.variantNames
        })

        artistFound = await Models.Artist.findByPk(artistFound.id)
        console.log(`ARTIST UPDATED BY SCRAPING !! ( idArtist: ${artistFound.idArtist} )`)
        console.log(`------------------------------`)


        res.status(200).json({ artist: artistFound })
      } catch (err) {
        if (/SequelizeUniqueConstraintError/i.test(err.name))
          return res.status(400).json({ message: `Artist (idArtist: ${err.fields.idRelease}) already exist` })

        res.status(500).json({ message: 'InternalError' })
      }
    })



  // TODO ------------------------------------
  router.route('/s/maj/master')
    .patch(
      async (req, res, next) => {
        try {
          const { body: master } = req
          master.idMaster = master.idMaster && typeof master.idMaster === 'string'
            ? +(master.idMaster)
            : master.idMaster

          let masterFound = await Models.Master.findOne({ where: { idMaster: master.idMaster }, rejectOnEmpty: true })
          await masterFound.update({
            title: master.title,
            // description: master.description,
            releaseDate: master.releaseDate,
            tracklist: master.tracklists
          })

          masterFound = await Models.Master.findByPk(masterFound.id)
          console.log(`MASTER UPDATED BY SCRAPING !! ( idMaster: ${masterFound.idMaster} )`)
          console.log(`------------------------------`)


          res.status(200).json({ master: masterFound })
        } catch (err) {
          if (/SequelizeUniqueConstraintError/i.test(err.name))
            return res.status(400).json({ message: `Master (idMaster: ${err.fields.idMaster}) already exist` })

          res.status(500).json({ message: 'InternalError' })
        }
      })


}