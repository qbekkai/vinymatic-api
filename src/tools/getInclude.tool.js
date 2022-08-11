const models = require('./../db/models')

module.exports = {
  getIncludeByRoute: (route) => {
    const _route = route
    let include = []

    switch (true) {
      case /^\/vinyl\//.test(_route):
        include.push({ model: models.Master, attributes: ["id", "idMaster", "title", "releaseDate", "thumbnail", "masterUrl"] });
        include.push({ model: models.Artist, as: "VinylMainArtists", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl"], through: { attributes: [] } });
        include.push({ model: models.Artist, as: "VinylCredits", attributes: ["id", "idArtist", "name", "thumbnail", "artistUrl"], through: { attributes: [] } });
        include.push({ model: models.Label, as: "VinylSocietes", attributes: ["id", "idLabel", "name"], through: { attributes: [] } });
        include.push({ model: models.Label, as: "VinylLabels", attributes: ["id", "idLabel", "name"], through: { attributes: ["catno"] } });
        include.push({ model: models.Format, attributes: ["id", "name"], through: { attributes: [] } });
        include.push({ model: models.Genre, attributes: ["id", "name"], through: { attributes: [] } });
        include.push({ model: models.Style, attributes: ["id", "name"], through: { attributes: [] } });
        include.push({ model: models.Audio, attributes: ["id", "title", "audioUrl", "duration", "position"] });
        break;
      case /^\/(?:collection|wishlist)\//.test(_route):
        include.push({ model: models.Vinyl, attributes: ["id", "title", "thumbnail"] });
        break;
      default: break;
    }

    return include
  }
}