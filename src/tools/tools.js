const Op = require('sequelize').Op;
const fs = require('fs')
const mime = require('mime')
const fetch = require('node-fetch');

const { Article, Artist, Format, SubFormat, Genre, Style, Label } = require('../db/models')


module.exports = {
  selectExtByMimeType: mimeString => mime.getExtension(mimeString),
  capitelize: (str) => (str[0].toUpperCase() + str.slice(1, str.length)),
  noFinalLetter: (str) => (str.slice(0, str.length - 1)),
  autocomplete: (field, value) => { return { [field]: { [Op.substring]: value } } },
  isJson: (json = null, string = null) => {
    try {
      if (json) JSON.stringify(json)
      else if (string) JSON.parse(string)
      else return false

      return true
    } catch (error) { return false }
  },
  isModelInInclude: (includeExist, modelToAdd) => {
    const model = modelToAdd
    const include = includeExist

    for (const iModel of include) {
      if (model.model == iModel.model) {
        if (model.as && iModel.as) {
          if (model.as == iModel.as) return { isInclude: true, model: iModel }
          else return false
        } else return { isInclude: true, model: iModel }
      }
    }
    return false
  },
  pagination: (params) => {
    if (params.isNoLimitPagination) return {}
    const limit = params.limit ? +(params.limit) : 10;
    const offset = params.page && params.page > 0 ? +(((params.page - 1) * limit)) : 0;
    return { limit, offset };
  },
  nPagination: (params, fullOption) => {
    const options = fullOption
    if (params.isNoLimitPagination) return {}
    options.limit = params.limit ? +(params.limit) : 10;
    options.offset = params.page && params.page > 0 ? +(((params.page - 1) * limit)) : 0;
    return options;
  },
  rangeFilter: (where, filterName, filter) => {
    const item = {
      min: filter.min ? +(filter.min) : 0,
      max: filter.max ? +(filter.max) : 1000000000
    };
    if (item.min < item.max) {
      if (item.min && !item.max) where[filterName] = { [Op.gt]: item.min };
      else if (!item.min && item.max) where[filterName] = { [Op.lt]: item.max };
      else where[filterName] = { [Op.between]: [item.min, item.max] };
      return true
    } else if (item.min > item.max) {
      return false;
    }
  },
  order: (qsParams, options = {}) => {
    const qss = qsParams
    if (qss && !qss.order)
      qss.order = { by: 'id', direction: 'ASC' }

    const { mainModel, associationModel } = options;
    const order = [];
    for (const qs of qss) {
      const qsOrder = [
        qs.order.by,
        qs.order.direction.toUpperCase()
      ]

      if (associationModel) {
        order.push([
          mainModel.associations[associationModel],
          ...qsOrder
        ])
      } else
        order.push(qsOrder)
    }

    return { order }
  },
  filter: (qsParams, options = {}) => {
    const where = {};
    const include = [];
    const { entity, sqlQuery } = options;

    if (/collection|wishlist/i.test(entity)) {
      for (const keyFilter of Object.keys(qsParams)) {
        valueFilter = qsParams[keyFilter];
        const includeFilter = {
          model: Vinyl,
          include: []
        }
        switch (true) {
          case /releaseDate|country/i.test(keyFilter):
            includeFilter.where = { [keyFilter]: valueFilter }
            break;
          case /^label/i.test(keyFilter):
            includeFilter.include.push({
              model: Label,
              as: 'VinylLabels',
              where: {
                name: { [Op.substring]: valueFilter }
              }
            })
          case /^artist/i.test(keyFilter):
            includeFilter.include.push({
              model: Artist,
              where: {
                name: { [Op.substring]: valueFilter }
              }
            })
            break;
          default: break;
        }
      }
    } else {
      for (const keyFilter of Object.keys(qsParams)) {
        valueFilter = qsParams[keyFilter];
        switch (true) {
          case /^releaseDate|country/i.test(keyFilter):
            where[keyFilter] = { [Op.substring]: valueFilter }
            break;
          case /^label/i.test(keyFilter):
            include.push({
              model: Label,
              as: 'VinylLabels',
              where: {
                name: { [Op.substring]: valueFilter }
              }
            })
            break;

          case /allnull/i.test(keyFilter):
            let field = ''
            switch (entity) {
              case 'vinyl': field = 'title'; break;
              case 'artist': field = 'fullName'; break;
              case 'label': field = 'catno'; break;
              default: break;
            }
            if (valueFilter === 'true') where[field] = { [Op.is]: null }
            else if (valueFilter === 'false') where[field] = { [Op.not]: null }
            break;
          default: break;
        }
      }
    }

    return { where, include }
  },
  newDate: (exp = 0) => {
    return (Math.round(Date.now() / 1000) + exp)
  },
  getArtistFormAudio: async (artists) => {
    const artistsToAddOnAudio = []
    for (const artist of artists) {
      let idArtist = 0;
      const gettedIdArtist = await Artist.findOne({ attributes: ["id"], where: { name: artist.artist.name } })
      if (gettedIdArtist) idArtist = gettedIdArtist.id
      else {
        const artistCreated = await Artist.create({ name: artist.artist.name })
        idArtist = artistCreated.id
      }

      const artistToAdd = {
        id: idArtist,
        name: artist.artist.name,
      }

      if (artist.creditRole) artistToAdd.creditRole = artist.creditRole

      artistsToAddOnAudio.push(artistToAdd)
    }
    return artistsToAddOnAudio
  },
  getWithColAsArray: (withCol) => {
    const withColObject = []
    if (typeof withCol.field === "object" && Array.isArray(withCol.field)) {
      if (withCol.field.length === withCol.value.length) {
        withCol.field.forEach((e, i) => {
          const col = { field: e, value: withCol.value[i] }
          withColObject.push(col)
        })
      }
    } else if (typeof withCol.field === "string") withColObject.push(withCol)

    return withColObject
  },
  isBooleanFromString: (str) => {
    if (typeof (str) === 'string') {
      if (str === 'true') return true
      else if (str === 'false') return false
    } else {
      throw { name: 'VinymaticApiInvalidType' }
    }
  }

};