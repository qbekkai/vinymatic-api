const { FormatInVinyl, FormatDescription, FormatSize } = require('./../../db/models')


module.exports = {
  byFormat: (value, fullOption) => {
    const options = fullOption
    const toInclude = { model: FormatDescription, attributes: ["name"], where: { name: { [Op.substring]: value } }, through: { attributes: [] } }

    const includeIndex = options.include.findIndex(el => el.model === FormatInVinyl)
    if (includeIndex === -1) {
      options.include.push({
        model: FormatInVinyl,
        include: [toInclude]
      })
    } else {
      options.include[includeIndex].include.push(toInclude)
    }
    return options
  },

  byFormatSize: (value, fullOption) => {
    const options = fullOption
    const toInclude = { model: FormatSize, attributes: ["name"], where: { name: { [Op.substring]: value } } }

    const includeIndex = options.include.findIndex(el => el.model === FormatInVinyl)
    if (includeIndex === -1) {
      options.include.push({
        model: FormatInVinyl,
        include: [toInclude]
      })
    } else {
      options.include[includeIndex].include.push(toInclude)
    }
    return options
  },

  byImagesNotNull: (query, fullOption) => {
    const options = fullOption
    const { isForImagesScrapingMaj } = query

    if (isForImagesScrapingMaj) {
      options.where = {
        ...options.where,
        images: {
          [Op.is]: null
        }
      }
    }
    return options
  },

  byVerified: (url, query, fullOption, opts = {}) => {
    const options = fullOption
    const { isForScrapingMaj, isErreurScraping } = query
    const { withVerifyColomn } = opts
    // let where = {}

    let keyId_ = null;
    switch (true) {
      case /vinyl/.test(url): keyId_ = 'idRelease'; break;
      case /master/.test(url): keyId_ = 'idMaster'; break;
      case /label/.test(url): keyId_ = 'idLabel'; break;
      case /artist/.test(url): keyId_ = 'idArtist'; break;
      default: break;
    }

    if (!withVerifyColomn) {
      if (isForScrapingMaj) {
        options.where = {
          ...options.where,
          [Op.and]: [
            { [keyId_]: { [Op.not]: null } },
            {
              thumbnail: {
                [Op.or]: [
                  { [Op.is]: null },
                  { [Op.substring]: '%discogs%' }
                ]
              }
            },
            {
              images: {
                [Op.or]: [
                  { [Op.is]: null },
                  { [Op.substring]: '%discogs%' }
                ]
              }
            },
          ]
        }

      } else if (isErreurScraping) {
        options.where = {
          ...options.where,
          [Op.and]: [{ [keyId_]: { [Op.is]: null } }]
        }
      } else {
        options.where = {
          ...options.where,
          [Op.and]: [
            { [keyId_]: { [Op.not]: null } },
            {
              thumbnail: {
                [Op.and]: [
                  { [Op.not]: null },
                  { [Op.notLike]: '%discogs%' }
                ]
              }
            },
            {
              images: {
                [Op.and]: [
                  { [Op.not]: null },
                  { [Op.notLike]: '%discogs%' }
                ]
              }
            },
          ]
        }
      }
    } else {
      options.where = {
        ...options.where,
        verify: { [Op.is]: true }
      }
    }

    return options
  }
}