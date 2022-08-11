const sequelize = { Op } = require('sequelize')

const Models = { Playlist, Master, Vinyl, Artist, Format, Genre, Style, Label, Audio, User, AudiosInPlaylist } = require('./../../db/models')
const entities = require('./entities')
const Tools = require('./../../tools/tools')
const { getModelByRoute, getModelByAssociation } = require('./../../tools/getModel.tool')
const { getAsAssociation } = require('./../../tools/getAssociation.tool')
const { getIncludeByRoute } = require('./../../tools/getInclude.tool')

const articleInclude = {
  model: Vinyl,
  attributes: entities.Vinyls,
}

module.exports = {
  getPaginationsOptions: (qsParams, optionsReq, otherOptions = {}) => {
    const qs = qsParams
    const options = optionsReq
    const { isNoLimitPagination } = otherOptions

    if (isNoLimitPagination) return options

    options.limit = qs.limit ? +(qs.limit) : 10;
    options.offset = qs.page && qs.page > 0 ? +(((qs.page - 1) * options.limit)) : 0;

    return options;
  },
  getAttributesOptions: (actualRoute, optionsReq, otherOptions = {}) => {
    const route = actualRoute
    const options = optionsReq
    const { getIdRelease } = otherOptions

    if (getIdRelease)
      options.attributes = ['idRelease']
    else {
      switch (true) {
        case /^\/vinyls/.test(route): options.attributes = entities.Vinyls; break;
        default: break;
      }
    }

    return options
  },
  getIncludesOptions: (actualRoute, optionsReq, otherOptions = {}) => {
    const route = actualRoute
    const options = optionsReq

    const newInclude = getIncludeByRoute(route)
    options.include = options.include.concat(newInclude)
    return options
  },
  getFilterOptions: (actualRoute, qsParams, optionsReq, otherOptions = {}) => {
    const route = actualRoute
    const qs = qsParams
    const options = optionsReq

    for (const key of Object.keys(qs)) {
      const value = qs[key]
      switch (true) {
        case /^releaseDate|country/i.test(key):
          options.where[key] = { [Op.substring]: value }
          break;
        case /^label/i.test(key):
          options.include.push({
            model: Label,
            as: 'VinylLabels',
            attributes: [],
            where: {
              name: { [Op.substring]: value }
            }
          })
        case /^artist/i.test(key):
          options.include.push({
            model: Artist,
            as: 'VinylMainArtists',
            attributes: [],
            where: {
              name: { [Op.substring]: value }
            }
          })
          break;
        case /allnull/i.test(key):
          let field = ''
          switch (true) {
            case /vinyl/.test(route): field = 'title'; break;
            case /artist/.test(route): field = 'fullName'; break;
            case /label/.test(route): field = 'catno'; break;
            default: break;
          }
          if (value === 'true') options.where[field] = { [Op.is]: null }
          else if (value === 'false') options.where[field] = { [Op.not]: null }
          break;
        default: break;
      }
    }

    return options
  },
  getOrderOptions: (actualRoute, qsParams, optionsReq, otherOptions = {}) => {
    const route = actualRoute;
    const mainModel = getModelByRoute(route)
    const options = optionsReq
    const qs = qsParams && !qsParams.order
      ? { order: { by: 'id', direction: 'ASC' } }
      : qsParams

    const qsOrder = [
      qs.order.by,
      qs.order.direction.toUpperCase()
    ]
    const associationToOrder = []

    if (qs.order.association) {
      const association = qs.order.association

      const associationInclude = { attributes: ["id", "title", "releaseDate"], through: { attributes: ["condition"] } }
      associationInclude.model = getModelByAssociation(association.name)
      associationInclude.as = getAsAssociation(route, association.name)
      associationToOrder.push({ model: associationInclude.model, as: associationInclude.as })

      if (association.association) {
        const m = {
          model: getModelByAssociation(association.association),
          as: getAsAssociation(route, association.association),
          attributes: ["id", "name"],
          through: { attributes: [] }
        }
        associationInclude.include = []
        associationInclude.include.push(m)
        associationToOrder.push({ model: m.model, as: m.as })
      }

      let isModelInInclude = Tools.isModelInInclude(options.include, associationInclude)
      if (isModelInInclude) {
        options.include = options.include.filter(i => {
          if (i.model != isModelInInclude.model.model) return i
          else {
            if (i.as && isModelInInclude.model.as && i.as != isModelInInclude.model.as)
              return i
          }
        })
      }

      options.include.push(associationInclude)
      options.order.push([
        ...associationToOrder,
        ...qsOrder
      ])
    } else
      options.order.push(qsOrder)


    return options
  },
  getOptionsForSQLRequest: (_this, url, query, otherOptions = {}) => {
    const { getIdRelease, isNoLimitPagination } = otherOptions
    let fullOptions = {
      attributes: null,
      include: [],
      where: {},
      order: [],
      offset: null,
      limit: null
    }

    fullOptions = _this.getAttributesOptions(url, fullOptions, { getIdRelease })
    fullOptions = _this.getIncludesOptions(url, fullOptions)
    fullOptions = _this.getFilterOptions(url, query, fullOptions)
    fullOptions = _this.getPaginationsOptions(query, fullOptions, { isNoLimitPagination });
    fullOptions = _this.getOrderOptions(url, query, fullOptions)

    return fullOptions
  },
  minimumOfData: {
    attributes: ["id"]
  },
  routes: {
    selling: {
      gets: {
        attributes: {
          exclude: ["description"]
        },
        include: [
          // { model: User, attributes: ["id", "username", "profilImage"] },
          // { model: Vinyl, attributes: ["id", "title", "thumbnail"] }
        ]
      }
    },
    collection: {
      get: {
        attributes: {
          exclude: ['UserId'],
        },
        include: [
          {
            model: Vinyl,
            attributes: ['id', 'title', 'thumbnail', 'releaseDate'],
            through: { attributes: ['condition'] }
          },
          { model: User, attributes: ['id', 'username'] }
        ]
      }
    },
    wishlist: {
      get: {
        attributes: {
          exclude: ['UserId'],
        },
        include: [
          { model: Vinyl, attributes: ['id', 'title', 'thumbnail'], through: { attributes: ['condition'] } },
          { model: User, attributes: ['id', 'username'] }
        ]
      }
    },
    store: {
      gets: {
        attributes: entities.Stores
      },
      get: {
        attributes: entities.Store,
      }
    },
    master: {
      gets: {
        attributes: [
          ...entities.Masters,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ]
      },
      get: {
        attributes: entities.Master,
        include: [
          { model: Vinyl, attributes: entities.Vinyls, limit: 1 },
          // { model: Artist, attributes: entities.Artist, through: { attributes: [] } }
        ],
      },
      versions: {
        attributes: [],
        include: [
          {
            model: Vinyl,
            attributes: [...entities.Vinyls, "description"],
            include: [
              { model: Label, as: "VinylLabels", attributes: ['id', 'name'], through: { attributes: ['catno'] } }
            ]
          },
        ],
      }
    },
    vinyl: {
      gets: {
        attributes: [
          ...entities.Vinyls,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ]
      },
      get: {
        attributes: entities.Vinyl,
        include: [
          { model: Master, attributes: entities.Masters },
          { model: Artist, as: "VinylMainArtists", attributes: entities.Artists, through: { attributes: [] } },
          { model: Artist, as: "VinylCredits", attributes: entities.Artists, through: { attributes: ['roleCredit', 'typeCredit'] } },
          { model: Label, as: "VinylLabels", attributes: entities.Labels, through: { attributes: [] } },
          { model: Label, as: "VinylSocietes", attributes: entities.Labels, through: { attributes: ['roleSociete'] } },
          { model: Format, attributes: entities.Format, through: { attributes: [] } },
          { model: Genre, attributes: entities.Genre, through: { attributes: [] } },
          { model: Style, attributes: entities.Style, through: { attributes: [] } },
          { model: Audio, attributes: entities.Audio }
        ],
      }
    },
    audio: {
      get: {
        attributes: ["id", "title", "description", "image", "duration", "position", "type", "audioUrl", "resourceUrl"],
        include: [
          { model: Vinyl, attributes: ["id", "idRelease", "title", "thumbnail"] },
          { model: Artist, as: "AudioMainArtists", attributes: ["id", "idArtist", "name", "thumbnail"] },
          { model: Artist, as: "AudioCredits", attributes: ["id", "idArtist", "name", "thumbnail"], through: { attributes: ["roleCredit", "typeCredit"] } },
          { model: Playlist, attributes: ["id", "title", "image", "playlistUrl", "resourceUrl"] }
        ]
      }
    },
    playlist: {
      get: {
        attributes: {
          include: [
            [sequelize.fn('COUNT', sequelize.col('Like.id')), 'like'],
            // [sequelize.fn('COUNT', sequelize.col('Audios.id')), 'trackCount'],
          ],
          exclude: ["UserId"],
        },
        include: [
          {
            model: Audio,
            attributes: ["id", "title", "image", "duration"],
            include: [
              { model: Artist, attributes: ["name"] }
            ],
            through: { attributes: ["position"] }
          },
          { model: User, as: "PlaylistLike", attributes: [], through: { attributes: [] } },
          { model: User, as: "Owner", attributes: ["username", "firstName", "lastName", "showName", "profilImage"] }
        ],
        group: ['Like.id', 'Audios.id']
      },
    },
    artist: {
      gets: {
        attributes: [
          ...entities.Artists,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ]
      },
      get: {
        attributes: entities.Artist,
        include: [
          { model: Vinyl, as: "VinylMainArtists", attributes: entities.Vinyls, through: { attributes: [] } },
          { model: Vinyl, as: "VinylCredits", attributes: entities.Vinyls, through: { attributes: [] } },
          { model: Master, as: "MasterMainArtists", attributes: entities.Masters, through: { attributes: [] } },
          { model: Master, as: "MasterCredits", attributes: entities.Masters, through: { attributes: [] } },
          { model: Audio, attributes: entities.Audios },
        ],
      }
    },
    label: {
      gets: {
        attributes: [
          ...entities.Label,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ]
      },
      get: {
        attributes: entities.Label,
        include: [
          { model: Vinyl, as: "VinylLabels", attributes: entities.Vinyls, through: { attributes: [] } },
          { model: Vinyl, as: "VinylSocietes", attributes: entities.Vinyls, through: { attributes: [] } },
        ],
      }
    },
    format: {
      gets: {
        attributes: [
          ...entities.Format,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ],
      },
      get: {
        attributes: [
          ...entities.Formats,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ],
        include: [
          { model: Vinyl, attributes: entities.Vinyls },
        ],
      }
    },
    genre: {
      gets: {
        attributes: [
          ...entities.Genre,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ],
      },
      get: {
        attributes: [
          ...entities.Genre,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ],
        include: [
          { model: Master, attributes: entities.Masters },
          { model: Vinyl, attributes: entities.Vinyls },
        ],
      },
    },
    style: {
      gets: {
        attributes: [
          ...entities.Style,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ],
      },
      get: {
        attributes: [
          ...entities.Style,
          // [sequelize.fn('COUNT', sequelize.col('released')), 'count'],
        ],
        include: [
          { model: Master, attributes: entities.Masters },
          { model: Vinyl, attributes: entities.Vinyls },
          { model: Genre, attributes: entities.Genre },
        ],
      },
    },
    user: {
      gets: {
        attributes: entities.Users
      },
      get: {
        attributes: {
          include: [
            [sequelize.fn("COUNT", sequelize.col("Followings->Follows.FollowingId")), "followings"],
            [sequelize.fn("COUNT", sequelize.col("Followers->Follows.FollowerId")), "followers"]
          ],
          exclude: ["emailToken", "verifiedEmail", "verifiedPhone", "password"]
        },
        include: [
          { model: User, as: "Followings", attributes: [], through: { attributes: [] } },
          { model: User, as: "Followers", attributes: [], through: { attributes: [] } }
        ],
        group: ["Followings->Follows.FollowingId", "Followers->Follows.FollowerId"]
      }
    },
  }
}