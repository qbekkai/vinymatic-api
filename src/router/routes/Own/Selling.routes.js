const { Label, Artist, Selling, User, Vinyl, sequelize } = require("./../../../db/models");
const ErrorMessage = require("../../../error/messages");
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR } = require("../../../error/constError");
const { routes: optionsForRes, minimumOfData, } = require("../../relations/includeEntity");
const { ValidationError, UniqueConstraintError, QueryTypes } = require("sequelize");
const { haveYouThePermission } = require("../../../auth/accessControl");
const includeEntity = require("../../relations/includeEntity");
const tools = require("./../../../tools/tools");
const { loadFile, getLineData, getEmptyLineIndex } = require("../../../tools/csv.tools");
const multer = require("multer");
const upload = multer({ dest: "./src/files/download/csv" });

const BucketS3Service = require('../../../files/s3')
const uploadImages = multer({ dest: './src/files/uploads' })
const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)


module.exports = (router) => {
  router.route("/own/sells")
    .get(haveYouThePermission("readAny", "all"), async (req, res, next) => {
      try {
        const { user, query } = req;
        const { page = null, limit = null, isSelled } = query;

        const pagination = tools.pagination({ page, limit });
        const options = {
          attributes: ["price", "devise", "coverCondition", "diskCondition", "isSelled", "additionalImages"],
          include: [
            {
              model: Vinyl, attributes: ["id", "title", "thumbnail", "country", "releaseDate"], include: [
                { model: Artist, as: "VinylMainArtists", attributes: ["name"], through: { attributes: [] } },
                { model: Label, as: "VinylLabels", attributes: ["name"], through: { attributes: ["catno"] } }
              ]
            },
          ],
          ...pagination,
        };

        if (isSelled !== undefined) {
          let isSelledBoolean = isSelled
          if (isSelledBoolean.localeCompare('true') === 0) isSelledBoolean = true
          else if (isSelledBoolean.localeCompare('false') === 0) isSelledBoolean = false
          options.where = { isSelled: isSelledBoolean }
        }
        const sellingGetted = await user.getSellings(options)
        res.status(200).json({ user, sell: sellingGetted });


      } catch (err) {
        if (err.name.localeCompare(EMPTY_ERROR) === 0)
          return res
            .status(404)
            .json({ message: ErrorMessage.getMessageByStatusCode(404) });

        return res
          .status(500)
          .json({ message: ErrorMessage.getMessageByStatusCode(500) });
      }
    })
    .post(haveYouThePermission("createOwn", "sell"),
      uploadImages.fields([
        { name: 'additionalImages' },
      ]),
      async (req, res, next) => {
        try {
          const { body, query, user, files } = req;

          const { title, description, price, devise, quantity, coverCondition, diskCondition, itemWeight } = body;
          const { vinylId } = query;

          const sellingAdded = await user.createSelling(body)
          const vinylGetted = await Vinyl.findByPk(vinylId)
          vinylGetted.addSelling(sellingAdded)

          if (files) {
            const sellingImage = {}
            for (const [key, value] of Object.entries(files)) {
              if (typeof value === 'object' && Array.isArray(value)) {
                const urls = []
                let positionImage = 1
                for (const file of value) {

                  let filename = `${title}_${vinylId}I${Date.now()}D${positionImage}P.jpg`;

                  const path = `sellings/images/${filename}`

                  const bucketS3Service = new BucketS3Service('image')
                  const uploadResult = await bucketS3Service.uploadFile(path, file)
                  await unlinkFile(file.path)

                  urls.push(`/image/${uploadResult.Key}`)
                  positionImage++
                }
                sellingImage.additionalImages = urls
              }
            }
            await sellingAdded.update(sellingImage)
          }

          const options = {
            attributes: ["price", "devise", "coverCondition", "diskCondition", "isSelled", "additionalImages"],
            include: [
              {
                model: Vinyl, attributes: ["id", "title", "thumbnail", "country", "releaseDate"], include: [
                  { model: Artist, as: "VinylMainArtists", attributes: ["name"], through: { attributes: [] } },
                  { model: Label, as: "VinylLabels", attributes: ["name"], through: { attributes: ["catno"] } }
                ]
              },
            ],
          };

          const sellingFound = await Selling.findByPk(sellingAdded.id, options)

          res.status(201).json({ user, sell: sellingFound });
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) });

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) });
        }
      });

  router.route("/own/sells/import")
    .post(
      haveYouThePermission("createOwn", "sell"),
      upload.fields([{ name: "csvFile" }]),
      async (req, res, next) => {
        try {
          const { user, files } = req;
          if (files) {
            const file = files.csvFile.pop();
            const { worksheet } = await loadFile(file);
            const line = await getEmptyLineIndex(worksheet);
            for (let i = 2; i < line; i++) {
              const { title, description, price, devise, quantity, vinylId: idRelease, status, coverCondition, diskCondition } = await getLineData(worksheet, i);

              if (status.localeCompare("For Sale") === 0) {
                const vinylFound = await Vinyl.findOne({
                  where: { idRelease },
                  ...includeEntity.routes.vinyl.gets
                });

                if (vinylFound) {
                  let sellingGetted;
                  const isSellingExist = await user.hasSell(vinylFound);
                  if (!isSellingExist)
                    await user.addSell(vinylFound, { through: { title, description, price, devise, quantity: quantity || 1, coverCondition, diskCondition, } });
                  else {
                    sellingGetted = await user.getSells({
                      attributes: [],
                      where: { id: vinylFound.id },
                    });
                    await user.setSells(vinylFound, { through: { quantity: quantity ? sellingGetted[0].Selling.quantity + quantity : (sellingGetted[0].Selling.quantity += 1), }, });
                  }
                } else console.log({ name: 'SequelizeEmptyResultError' })
              }
            }

            res.status(201).json({ message: "done" });
          } else throw { name: "VinymaticApiEmptyFile" };
        } catch (err) {
          if (
            err instanceof ValidationError ||
            err instanceof UniqueConstraintError
          )
            return res
              .status(400)
              .json({ message: ErrorMessage.getMessageByStatusCode(400) });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res
              .status(404)
              .json({ message: ErrorMessage.getMessageByStatusCode(404) });

          return res
            .status(500)
            .json({ message: ErrorMessage.getMessageByStatusCode(500) });
        }
      }
    );
};
