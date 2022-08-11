const { Store, sequelize } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require('../../error/constError')
const includeEntity = require('../relations/includeEntity')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const Tools = require('../../tools/tools')
const storeTool = require('../../tools/store.tool')
const { haveYouThePermission } = require('../../auth/accessControl')



module.exports = (router) => {
  router.route('/stores')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const params = req.query;
          const pagination = Tools.pagination(params);
          const options = {
            ...includeEntity.routes.store.gets,
            ...pagination
          };

          const stores = await Store.findAll(options)
          res.status(200).json({ stores })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
    .post(
      haveYouThePermission('createAny', 'store'),
      async (req, res, next) => {
        try {
          /** TODO: post by place_id */
          const { body: store, query } = req
          const { placeId } = query
          // const store = await Store.create(req.body, { validator: req.query.v })
          const storeCreated = await Store.create(store)
          res.status(201).json({ store: storeCreated })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })


  /** ITEMS OPPERATION */
  router.route('/store/:id')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const store = await Store.findByPk(req.params.id, { ...includeEntity.routes.store.get, rejectOnEmpty: true })
          res.status(200).json({ store })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })

  router.route('/near/store')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { body, query } = req
          const { lat, lon, distance } = query
          const { offset, limit } = Tools.pagination(query);
          let store = await sequelize.query(`
			SELECT * FROM (
				SELECT *,
					(
						(
							(
								acos(
									sin(( ${lat} * pi() / 180))
									*
									sin(( json_value(geometry,'$.location.lat') * pi() / 180)) + cos(( ${lat} * pi() /180 ))
									*
									cos(( json_value(geometry,'$.location.lat') * pi() / 180)) * cos((( ${lon} - json_value(geometry,'$.location.lng')) * pi()/180)))
							) * 180/pi()
						) * 60 * 1.1515 * 1.609344
					)
				as distance FROM Stores
			) Stores
			WHERE distance <= ${distance} limit ${limit} offset ${offset};
			`)
          store[0].map(s => {
            let store = s
            store.distance = Number(store.distance.toFixed(3))

            return store
          })
          res.status(200).json({ stores: store[0] })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })
  // .patch(
  //   haveYouThePermission('updateAny', 'store'),
  //   async (req, res, next) => {
  //     try {
  //       const id = req.params.id
  //       const toUpdate = await Store.update(req.body, { where: { id: id } })
  //       if (toUpdate == null || toUpdate[0] === 0) throw { name: 'VinymaticApiNoModification' }

  //       const store = await Store.findByPk(id, { rejectOnEmpty: true })
  //       res.status(200).json({ store })

  //     } catch (err) {
  //       if (err.name.localeCompare(NO_MODIFICATION_ERROR) === 0)
  //         return res.status(304).json({ message: "Aucune modification apporter" })

  //       if (err instanceof ValidationError || err instanceof UniqueConstraintError)
  //         return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

  //       if (err.name.localeCompare(EMPTY_ERROR) === 0)
  //         return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

  //       return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
  //     }
  //   })

  router.route('/store/name/:name')
    .get(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const { params: { name }, query } = req
          const pagination = Tools.pagination(query);

          const options1 = {
            ...includeEntity.routes.store.gets,
            where: { name: { [Op.substring]: name } },
            ...pagination,
            rejectOnEmpty: true
          };

          const options2 = {
            ...includeEntity.routes.store.gets,
            ...pagination
          };
          let stores
          if (name.length >= 3) stores = await Store.findAll(options1)
          if (name.length < 3) stores = await Store.findAll(options2)



          res.status(200).json({ stores })
        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })

  router.route('/store/import')
    .post(
      haveYouThePermission('readAny', 'all'),
      async (req, res, next) => {
        try {
          const storeValues = await storeTool.getValueSql().catch(err => { throw err });
          for (const v of storeValues) {
            const sql = storeTool.prepareRequest(v)
            await sequelize.query(sql).catch(err => { throw err })
          }

          res.status(200).send(true)
        } catch (err) {
          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })
}

