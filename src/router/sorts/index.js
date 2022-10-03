const { Artist, Label } = require('./../../db/models')


module.exports = {
  byTitle: (direction, fullOption) => {
    const options = fullOption
    options.order.push(['title', direction])
    return options
  },

  byReleaseDate: (direction, fullOption) => {
    const options = fullOption
    options.order.push(['releaseDate', direction])
    return options
  },

  byMainArtist: (direction, fullOption) => {
    const options = fullOption
    options.include.push({ model: Artist, as: 'VinylMainArtists', attributes: ["name"], through: { attributes: [] } })
    options.order.push([{ model: Artist, as: 'VinylMainArtists' }, 'name', direction])
    return options
  },

  byLabel: (direction, fullOption) => {
    const options = fullOption
    options.include.push({ model: Label, as: 'VinylLabels', attributes: ["name"], through: { attributes: ["catno"] } })
    options.order.push([{ model: Label, as: 'VinylLabels' }, 'name', direction])
    return options
  },
}