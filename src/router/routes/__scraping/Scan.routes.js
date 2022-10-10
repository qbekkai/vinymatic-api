const Models = require('./../../../db/models')

const scanData = require('./../../../../datas/scan.data')
const { addFormat } = require('./../../../tools/format.tool')

module.exports = (router) => {
  router.route('/s/scan/vinyl')
    .post(
      async (req, res, next) => {
        try {
          const { body: vinyl } = req
          // const vinyl = body = scanData
          vinyl.idRelease = vinyl.idRelease && typeof vinyl.idRelease === 'string'
            ? +(vinyl.idRelease)
            : vinyl.idRelease

          const vinylCreated = await Models.Vinyl.create({ idRelease: vinyl.idRelease })


          let findOne = null;
          for (const [key, values] of Object.entries(vinyl)) {
            switch (true) {
              case (values && /idMaster/i.test(key)):
                findOne = await Models.Master.findOne({ where: { idMaster: vinyl.idMaster } })
                if (findOne !== null) await findOne.addVinyl(vinylCreated)
                else await vinylCreated.createMaster({ idMaster: vinyl.idMaster })
                break;
              case (values && /format/i.test(key) && values.length !== 0):
                for (const value of values)
                  await addFormat(value, vinylCreated)
                break;
              case (values && /genre/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Genre.findOne({ where: value })
                  if (findOne !== null) await vinylCreated.addGenre(findOne)
                }
                break;
              case (values && /style/i.test(key) && values.length !== 0):
                for (const value of values) {
                  findOne = await Models.Style.findOne({ where: value })
                  if (findOne !== null) await vinylCreated.addStyle(findOne)
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
            }
          }


          const vinylFound = await Models.Vinyl.findByPk(vinylCreated.id)
          console.log(`VINYL CREATED BY SCRAPING !! ( idRelease: ${vinylFound.idRelease})`)
          console.log(`------------------------------`)

          res.status(201).json({ vinyl: vinylFound })
        } catch (err) {
          if (/SequelizeUniqueConstraintError/i.test(err.name)) {
            return res.status(400).json({ message: `Vinyl (idRelease: ${err.fields.idRelease}) already exist` })
          }
          res.status(500).json({ message: 'InternalError' })
        }
      })
}
