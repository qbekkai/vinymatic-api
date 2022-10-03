// const { ValidationError, UniqueConstraintError } = require('sequelize')
const Models = { User, Wishlist, Collection, Vinyl, Artist, Format, Genre, Style, Label, Audio, User, sequelize } = require('./../../db/models')

const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')

const Tools = require('../../tools/tools')
const includeEntity = require('../relations/includeEntity')
const { haveYouThePermission } = require('../../auth/accessControl')
const { getPaginationsOptions } = require('../relations/includeEntity')


module.exports = (router) => {
  router.route('/vinyls/search')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query } = req
          let { by, isInCollection, isInWishlist, whichUser, isVariousArtist } = query

          isInCollection = isInCollection && isInCollection.localeCompare('true') === 0 ? true : false
          isInWishlist = isInWishlist && isInWishlist.localeCompare('true') === 0 ? true : false
          isVariousArtist = isVariousArtist && isVariousArtist.localeCompare('true') === 0 ? true : false

          let mainOptions = {}
          const vinylOptions = {
            attributes: ["id", "idRelease", "title", "thumbnail", "vinylUrl", "resourceUrl"],
            include: [],
            where: { [Op.or]: [] },
            subQuery: false
          }

          if (by) {
            for (const searchParamKey of Object.keys(by)) {
              const searchParamValue = by[searchParamKey]
              switch (true) {
                case /vinylTitle/.test(searchParamKey):
                  vinylOptions.where[Op.or].push({ title: { [Op.substring]: searchParamValue } })
                  break;
                case /labelName/.test(searchParamKey):
                  vinylOptions.include.push({
                    model: Label, as: "VinylLabels",
                    attributes: ["id", "idLabel", "name"],
                    through: { attributes: [] }
                  })

                  vinylOptions.where[Op.or].push({ "$VinylLabels.name$": { [Op.substring]: searchParamValue } })
                  break;
                case /labelCatno/.test(searchParamKey):
                  vinylOptions.include.push({
                    model: Label, as: "VinylLabels",
                    attributes: ["id", "idLabel", "name"],
                    through: { attributes: ["catno"] }
                  })

                  vinylOptions.where[Op.or].push({ "$VinylLabels.LabelsInVinyl.catno$": { [Op.substring]: searchParamValue } })
                  break;
                case /artistName/.test(searchParamKey):
                  if (isVariousArtist) break;
                  vinylOptions.include.push({
                    model: Artist, as: "VinylMainArtists",
                    attributes: ["id", "idArtist", "name"],
                    through: { attributes: [] }
                  })

                  vinylOptions.where[Op.or].push({ "$VinylMainArtists.name$": { [Op.substring]: searchParamValue } })
                  break;
                case /genreName/.test(searchParamKey):
                  vinylOptions.include.push({
                    model: Genre,
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                  })

                  vinylOptions.where[Op.or].push({ "$Genres.name$": { [Op.substring]: searchParamValue } })
                  break;
                case /styleName/.test(searchParamKey):
                  vinylOptions.include.push({
                    model: Style,
                    attributes: ["id", "name"],
                    through: { attributes: [] }
                  })

                  vinylOptions.where[Op.or].push({ "$Styles.name$": { [Op.substring]: searchParamValue } })
                  break;

                default: throw { name: 'VinymaticInvalidParams' }
              }
            }
          }

          if (isVariousArtist) {
            vinylOptions.include.push({
              model: Artist, as: "VinylMainArtists",
              attributes: [],
              through: { attributes: [] },
            })
            vinylOptions.where[Op.or].push({ "$VinylMainArtists.id$": 1 })
          }


          if (isInCollection && isInWishlist)
            throw { name: 'VinymaticInvalidParams' }
          else if (isInCollection || isInWishlist) {
            if (!whichUser)
              throw { name: 'VinymaticInvalidParams' }
            else {
              if (!by)
                throw { name: 'VinymaticInvalidParams' }
              else {
                mainOptions = {
                  attributes: ["id"],
                  include: [
                    { model: Vinyl, attributes: { exclude: ["serie"] } },
                    {
                      model: User,
                      attributes: ["id", "username"],
                      where: { id: `${whichUser}` },

                    },
                  ],
                  rejectOnEmpty: true
                }
              }
            }
          } else mainOptions = vinylOptions

          /** Operation DB */
          let vinylGetted = null
          if (isInCollection || isInWishlist) {
            let itemFound = null;
            switch (true) {
              case !isInCollection && !!isInWishlist: itemFound = await Wishlist.findOne(mainOptions); break;
              case !!isInCollection && !isInWishlist: itemFound = await Collection.findOne(mainOptions); break;
            }
            vinylGetted = await itemFound.getVinyls(vinylOptions)
          } else {
            const paginations = Tools.pagination(query);
            mainOptions = { ...mainOptions, ...paginations }
            vinylGetted = await Vinyl.findAll(mainOptions)
          }

          req.results = { vinyls: vinylGetted }
          next()
        } catch (err) {
          if (
            err.name.localeCompare(NO_CRITRIA_ERROR) === 0 ||
            err.name.localeCompare('VinymaticInvalidParams') === 0
          )
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });



          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
  router.route('/users/search')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { query, user } = req
          const { who = null, what } = query

          let whereClause = {
            [Op.or]: []
          }

          if (query.username) {
            if (Tools.isJson(null, query.username)) {
              const value = JSON.parse(query.username)
              value.forEach(v => { whereClause[Op.or].push({ username: { [Op.substring]: v } }) });
            } else {
              const value = query.username
              whereClause[Op.or].push({ username: { [Op.substring]: value } })
            }
          }

          if (query.showName) {
            if (Tools.isJson(null, query.showName)) {
              const value = JSON.parse(query.showName)
              value.forEach(v => { whereClause[Op.or].push({ showName: { [Op.substring]: v } }) });
            } else {
              const value = query.showName
              whereClause[Op.or].push({ showName: { [Op.substring]: value } })
            }
          }

          if (query.firstName) {
            if (Tools.isJson(null, query.firstName)) {
              const value = JSON.parse(query.firstName)
              value.forEach(v => { whereClause[Op.or].push({ firstName: { [Op.substring]: v } }) });
            } else {
              const value = query.firstName
              whereClause[Op.or].push({ firstName: { [Op.substring]: value } })
            }
          }

          if (query.lastName) {
            if (Tools.isJson(null, query.lastName)) {
              const value = JSON.parse(query.lastName)
              value.forEach(v => { whereClause[Op.or].push({ lastName: { [Op.substring]: v } }) });
            } else {
              const value = query.lastName
              whereClause[Op.or].push({ lastName: { [Op.substring]: value } })
            }
          }

          const options = { ...includeEntity.routes.user.gets }
          let optionsInclude = {}


          if (what) {
            optionsInclude = {
              ...includeEntity.routes.user.gets,
              where: whereClause
            }

            if (who) {
              if (who.id) options.where = { id: who.id };
              if (who.username) options.where = { username: who.username };
            } else {
              if (user && user.username) {
                options.where = { username: user.username };
              } else throw { name: "VinymatiApiNoUser" }
            }
          } else {
            if (who) throw { name: "VinymatiApiNoCriteriaError" }
            else options.where = whereClause
          }

          const usersFound = await User.findAll({ ...options, rejectOnEmpty: true })

          if (what) {
            const followGetted = await usersFound[0][`get${Tools.capitelize(what)}`](optionsInclude)
            res.status(200).json({ user: { ...usersFound[0].dataValues, [`${Tools.capitelize(what)}`]: followGetted } })
          } else res.status(200).json({ users: usersFound })
        } catch (err) {
          if (
            err.name.localeCompare(NO_USER_ERROR) === 0 ||
            err.name.localeCompare(NO_CRITRIA_ERROR) === 0
          )
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}

