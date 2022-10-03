const express = require('express');
const tokenMW = require('./../middlewares/token.mw')


const router = express.Router();
router.use('/own', tokenMW.getUserFromToken)

router.route('/').get(async (req, res, next) => { res.redirect('/doc') })
router.route('/auth/google').get(async (req, res, next) => { res.render('btnGoogle') })
router.route('/auth/apple').get(async (req, res, next) => { res.render('btnApple') })


// router.route('/auth/google').get(
//   async (req, res, next) => {
//     res.render('buttonLogin')
//   })

require('./routes/__scraping/maj.routes')(router)
require('./routes/__scraping/Scraping.routes')(router)
require('./routes/__helpers/Helpers.routes')(router)


// OWN
require('./routes/Own/Collection.routes')(router)
require('./routes/Own/Follow.routes')(router)
require('./routes/Own/Playlist.routes')(router)
require('./routes/Own/Selling.routes')(router)
require('./routes/Own/User.routes')(router)
require('./routes/Own/Wishlist.routes'); (router)
require('./routes/Own/Transporter.routes')(router)

// require('./routes/documentation.routes')(router)
require('./routes/ModifEntityRequest.routes')(router)
require('./routes/Artist.routes')(router)
require('./routes/Audio.routes')(router)
require('./routes/Format.routes')(router)
require('./routes/File.routes')(router)
require('./routes/Genre.routes')(router)
require('./routes/Identifier.routes')(router)
require('./routes/Image.routes')(router)
require('./routes/Label.routes')(router)
require('./routes/Login.routes')(router)
require('./routes/Master.routes')(router)
require('./routes/Playlist.routes')(router)
require('./routes/Searches.routes')(router)
require('./routes/Selling.routes')(router)
require('./routes/Store.routes')(router)
require('./routes/Style.routes')(router)
require('./routes/User.routes')(router)
require('./routes/Video.routes')(router)
require('./routes/Vinyl.routes')(router)
require("./routes/Transporter.routes")(router)


module.exports = router