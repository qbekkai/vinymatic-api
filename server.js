if (/prod/i.test(process.env.NODE_ENV))
  require('dotenv').config({ path: './.env.prod' })
else if (/test/i.test(process.env.NODE_ENV))
  require('dotenv').config({ path: './.env.test' })
else
  require('dotenv').config({ path: './.env.local' })


const yaml = require('js-yaml');
const fs = require('fs');
const cors = require('cors');
const ejs = require('ejs');

const express = require('express');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express')
// const swaggerFile = require('./src/swagger/swagger_output.json')
const swaggerFile = yaml.load(fs.readFileSync('./src/swagger/swagger_output.yaml', 'utf8'));

const db = require('./src/db/models')
const auth = require('./src/auth/auth')
const router = require('./src/router');
const ErrorsHandler = require('./src/error');
const errorRequest = require('./src/middlewares/errorRequest.mw');
const resultRequest = require('./src/middlewares/resultRequest.mw');
const spotedErrorMw = require('./src/middlewares/spotedError.mw');

const hostname = process.env.URL_API.replace(/https?:\/\//, '');
const port = process.env.PORT_API;

const app = express();

app
  .set('view engine', 'ejs')
  .use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))
  .use(cors())
  .use(express.json())
  .use(auth)
  .use(router)
  // .use(errorRequest)
  .use(resultRequest)
  .use(spotedErrorMw)
  .use(morgan('dev'))

// ERROR
// .use(ErrorsHandler.logError)
// .use(ErrorsHandler.unknowRouteHandle)

// app.get(('/button-login'), (req, res, next) => { res.render('buttonLogin') })

// db.init(db)


app.listen(port, hostname, function () {
  console.log("Mon serveur fonctionne sur http://" + hostname + ":" + port);
});

