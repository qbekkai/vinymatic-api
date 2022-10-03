const Models = require('./../../../db/models')
const { haveYouThePermission } = require('../../../auth/accessControl')


module.exports = (router) => {
  router.route('/h/vinyl/r/:idRelease')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params: { idRelease } } = req
          const vinylGetted = await Models.Vinyl.findOne({
            include: [
              { model: Models.Identifier, attributes: ["type", "value", "description"] },
              { model: Models.Master, attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl"] },
              { model: Models.Artist, as: "VinylMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: [] } },
              { model: Models.Artist, as: "VinylCredits", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl", "resourceUrl"], through: { attributes: ["roleCredit", "typeCredit"] } },
              { model: Models.Label, as: "VinylLabels", attributes: ["id", "idLabel", "name", "thumbnail"], through: { attributes: ["catno"] } },
              { model: Models.Label, as: "VinylSocietes", attributes: ["id", "idLabel", "name"], through: { attributes: ["roleSociete", "typeSociete"] } },
              { model: Models.Label, as: "VinylSeries", attributes: ["id", "idLabel", "name"], through: { attributes: ["catno"] } },
              { model: Models.Genre, attributes: ["id", "name"], through: { attributes: [] } },
              { model: Models.Style, attributes: ["id", "name"], through: { attributes: [] } },
              // { model: Models.Audio, attributes: ["id", "title", "audioUrl", "duration", "position"] },
            ],
            where: { idRelease },
            rejectOnEmpty: true
          })
          res.status(200).json({ vinyl: vinylGetted })
        } catch (err) {
          if (/SequelizeEmptyResultError/.test(err.name))
            return res.status(404).json({ message: 'EmptyResultError' })

          res.status(500).json({ message: 'InternalError' })
        }
      })

}