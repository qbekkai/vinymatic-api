const { Artist } = require('./../../db/models')


module.exports = {
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
}