const { Transporter } = require('./../../../db/models')
const ErrorMessage = require('../../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../../error/constError')
const { haveYouThePermission } = require('../../../auth/accessControl')
const tools = require('./../../../tools/tools')
const { EmptyResultError } = require('sequelize/lib/errors')


module.exports = (router) => {

  /** ITEMS OPPERATION */
  router.route('/own/transporters')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { user } = req


          const transportersFound = await user.getTransporters();
          const results = transportersFound.map((t) => {
            return {
              id: t.id,
              name: t.name,
              image: t.image,
              // freeCondition: t.freeCondition,
              deliveryDelay: t.deliveryDelay,
              freeCondition: t.UserTransporters.freeCondition,
              continents: t.UserTransporters.continents
            }
          })

          res.status(200).json({ own: user, transporters: results })

        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/own/transporters/transporter/:transporterId')
    .post(
      // haveYouThePermission('createOwn', 'collection:vinyl'),
      async (req, res, next) => {
        try {
          const { params, user, body } = req
          const { transporterId } = params
          const { freeCondition, continents } = body

          const transporterGetted = await Transporter.findOne({ where: { id: transporterId } })
          const transporterAdded = await user.addTransporter(transporterGetted, { through: { freeCondition, continents } })

          const result = {
            ...transporterGetted.dataValues,
            freeCondition: transporterAdded[0].dataValues.freeCondition,
            continents: transporterAdded[0].dataValues.continents
          }
          res.status(201).json({ user, transporterAdded: result })
        } catch (err) {
          if (err.name.localeCompare(ALREADY_EXIST_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .patch(
      // haveYouThePermission('createOwn', 'collection:vinyl'),
      async (req, res, next) => {
        try {
          const { params, user, body } = req
          const { transporterId } = params
          const { freeCondition, continents } = body

          const transporterGetted = (await user.getTransporters({
            where: {
              id: transporterId
            }
          }))[0]

          await user.removeTransporter(transporterGetted)
          const transporterAdded = await user.addTransporter(transporterGetted, { through: { freeCondition, continents } })

          /* const ut = transporterGetted.dataValues.UserTransporters.dataValues
          ut.prices = prices
          ut.continents = continents
          	
          await transporterGetted.save()
          await transporterGetted.UserTransporters.save()
          */
          const result = {
            ...transporterAdded.dataValues,
            freeCondition: freeCondition,
            continents: continents
          }
          res.status(201).json({ user, transporterGetted: result })
        } catch (err) {
          if (err.name.localeCompare(ALREADY_EXIST_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .delete(
      // haveYouThePermission('createOwn', 'collection:vinyl'),
      async (req, res, next) => {
        try {
          const { params: { transporterId }, user } = req

          if (await user.hasTransporter(+transporterId)) await user.removeTransporter(+transporterId)
          else throw new EmptyResultError()

          if (!await user.hasTransporter(+transporterId)) res.status(204).json({})
          else throw { name: 'VinymaticApiTransporterNotDeleted' }

        } catch (err) {
          if (err.name.localeCompare(ALREADY_EXIST_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}