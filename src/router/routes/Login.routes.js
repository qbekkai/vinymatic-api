const { URL_API, PORT_API, TOKEN_API, ANDROID_PACKAGE_IDENTIFIER, MESSAGE_BIRD_API_KEY, SEND_GRID_API_KEY } = process.env

const bcrypt = require('bcrypt')
const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const sgMail = require('@sendgrid/mail')
const { ValidationError, UniqueConstraintError } = require('sequelize')
const { OAuth2Client } = require('google-auth-library');


const { User, VerifEmailUserCode } = require('./../../db/models')
const ErrorMessage = require('../../error/messages')
const { EMPTY_ERROR, REFERENCE_ERROR, MALFORMED_TOKEN_ERROR, EXPIRED_TOKEN_ERROR, IS_LOGIN_ERROR, ALREADY_USED_CODE_ERROR, INVALID_CODE_ERROR, EXPIRED_CODE_ERROR, NO_EMAIL_NO_PHONENUMBER_ERROR, USER_INVALID_PASSWORD_ERROR, NO_USER_ERROR, NO_CRITRIA_ERROR, ALREADY_EXIST_ERROR, NOT_EXIST_ERROR, NO_MODIFICATION_ERROR, NO_ENTITY_SELECTED_ERROR, ANONYMOUS_USER_ERROR, EMAIL_MUST_BE_VERIFIED } = require('../../error/constError')
const tokenControl = require('../../auth/generateToken')
const { haveYouThePermission, isLogin } = require('../../auth/accessControl')
const Tools = require('../../tools/tools')
const imageTools = require('../../tools/images.tool')
const verifyThirdPart = require('../../services/loginService')
const { decodeToken, refresh } = require('../../../src/auth/generateToken')

const privateKey = require('../../auth/privateKey').privateKey
const { nextTick } = require('process')
const messageBird = require('messagebird')(MESSAGE_BIRD_API_KEY)
sgMail.setApiKey(SEND_GRID_API_KEY)

const multer = require('multer')
const ApiService = require('../../services/apiService')
const upload = multer({ dest: './src/files/uploads' })


module.exports = (router) => {
  router.route('/registration')
    .post(
      // async (req, res, next) => {
      //   const { email: emailToAdd, smsId, code: codeToVerif } = req.body

      //   if (!smsId && !emailToAdd) return res.status(400).send({ message: ErrorMessage.getMessageByStatusCode(400, { verifRegister: true }) })

      //   if (emailToAdd) {
      //     const { id, code, exp, isUsed } = await VerifEmailUserCode.findOne({ where: { email: emailToAdd }, order: [['createdAt', 'DESC']] })
      //     if (exp < Tools.newDate()) return res.status(401).json({ message: `Le code a expiré` })
      //     if (code != codeToVerif) return res.status(401).json({ message: `Le code taper n'est pas identique au code envoyer` })
      //     if (isUsed) return res.status(401).json({ message: `Le code a déjà été utilisé` })
      //     await VerifEmailUserCode.update({ isUsed: true }, { where: { id } })
      //     return next()
      //   }

      //   if (smsId) {
      //     messageBird.verify.verify(smsId, codeToVerif, async (err, res1) => {
      //       if (err) {
      //         switch (true) {
      //           case /the token has expired/i.test(err.message):
      //             return res.status(401).json({ message: `Le code a expiré` })
      //           case /the token has already been processed/i.test(err.message):
      //             return res.status(401).json({ message: `Le code a déjà été utilisé` })
      //           default: return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) }); break;
      //         }
      //       }
      //       return next()
      //     })
      //   }
      // },
      haveYouThePermission('createOwn', 'user:registration'),
      upload.fields([{ name: 'profilImage' }, { name: 'coverImage' }]),
      async (req, res, next) => {
        try {
          const { body, files } = req
          const userToAdd = {
            ...body,
            role: 'basic'
          }

          userToAdd.username = userToAdd.username ? userToAdd.username.toLowerCase() : null
          const userCreated = await User.create(userToAdd)
          await userCreated.createCollection()
          await userCreated.createWishlist()

          // if (files) {

          //   if (files.profilImage) {
          //     const options = imageTools.getOptionForuploadImageFile(file.profilImage, 'user', userCreated, user)
          //     const userImage = await imageTools.uploadImageFile(options)
          //     await userCreated.update(userImage)
          //   }


          //   if (files.coverImage) {
          //     const userImage = await imageTools.uploadImageFile(files.images, 'user', { itemDb: userCreated, itemAd: user })
          //     await userCreated.update(userImage)
          //   }
          // }

          if (files) {
            if (files.profilImage) {
              const options = imageTools.getOptionForuploadImageFile(files.profilImage, 'user', userCreated, userToAdd)
              const userImage = await imageTools.uploadImageFile(options)
              await userCreated.update(userImage)
            }
            if (files.coverImage) {
              const options = imageTools.getOptionForuploadImageFile(files.coverImage, 'user', userCreated, userToAdd)
              const userImage = await imageTools.uploadImageFile(options)
              await userCreated.update(userImage)
            }
          }

          const { id: userID, firstName, lastName, username, role } = userCreated
          const token = tokenControl.getToken({ username, role })

          res.status(201).json({ userID, firstName, lastName, token })
          // res.status(201).json({ message: ErrorMessage.getMessageByStatusCode(201), data: user })
        } catch (err) {
          if (err instanceof ValidationError || err instanceof UniqueConstraintError)
            return res.status(400).json({ name: 'VinymaticApi:BadRequest' });

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ name: 'VinymaticApi:ItemNotFound' })

          return res.status(500).json({ name: 'InternalError' })
        }
      })

  router.route('/third-part-registration')
    .post(
      haveYouThePermission('createOwn', 'user:registration'),
      async (req, res, next) => {
        try {
          const { body: { token: thirdPartToken, appleUser = null, opts = {} } } = req

          if (!thirdPartToken) throw { name: 'VinymaticApi:NoThirdPartToken' }

          const { ticket: payloadToken } = await verifyThirdPart(thirdPartToken, null, opts)
          const userToAdd = {}
          if (/google\.com/.test(payloadToken.iss)) {
            userToAdd.userGoogleId = payloadToken['sub']
            userToAdd.role = 'basic'

            userToAdd.email = payloadToken['email']

            userToAdd.showName = payloadToken['name']
            userToAdd.username = `${payloadToken['given_name'][0]}${payloadToken['family_name']}`.trim().toLowerCase()
            userToAdd.firstName = payloadToken['given_name']
            userToAdd.lastName = payloadToken['family_name']
            userToAdd.profilImage = payloadToken['picture']
            console.log('Google Register', userToAdd)
          } if (/apple\.com/.test(payloadToken.iss)) {
            userToAdd.userAppleId = payloadToken['sub']
            userToAdd.role = 'basic'

            if (appleUser) {
              userToAdd.email = payloadToken['email']

              const appleUserObject = JSON.parse(appleUser)
              userToAdd.username = `${appleUserObject.name.firstName[0]}${appleUserObject.name.lastName}`.trim().toLowerCase()
              userToAdd.showName = `${appleUserObject.name.firstName} ${appleUserObject.name.lastName}`
              userToAdd.firstName = appleUserObject.name.firstName
              userToAdd.lastName = appleUserObject.name.lastName
              // userToAdd.profilImage = payloadToken['picture']
            } else {
              userToAdd.username = `User_${payloadToken['iat']}`
            }
            console.log('Apple Register', userToAdd)
          }


          const user = await User.create(userToAdd)
          await user.createCollection()
          await user.createWishlist()

          const { id: userID, firstName, lastName, username, role, userGoogleId, userAppleId } = user
          let token = null
          if (userGoogleId) token = tokenControl.getToken({ username, role, userGoogleId })
          if (userAppleId) token = tokenControl.getToken({ username, role, userAppleId })
          else token = tokenControl.getToken({ username, role, userAppleId })


          res.status(201).json({ userID, firstName, lastName, token })

        } catch (err) {
          console.log(err)
          if (
            err instanceof ValidationError || err instanceof UniqueConstraintError ||
            /Wrong number of segments in token/.test(err.message)
          )
            return res.status(400).json({ name: 'VinymaticApi:BadRequest' });

          if (/VinymaticApi:ThirdPartLogin:NoToken/.test(err.name))
            return res.status(400).json({ name: 'VinymaticApi:ThirdPartLogin:NoToken' });

          if (/GoogleApi:InvalidToken/.test(err.name))
            return res.status(401).json({ name: 'GoogleApi:InvalidToken' })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ name: 'VinymaticApi:ItemNotFound' })

          return res.status(500).json({ name: 'InternalError' })
        }
      }
    )
  router.route('/login')
    .post(
      isLogin(),
      haveYouThePermission('readOwn', 'user'),
      async (req, res, next) => {
        try {
          const { body, query: { useBundleId } } = req;
          const { email, username: usernameBody, phoneNumber, password, token: thirdPartToken = null, appleUser = null, appleCode = null } = body;
          let token = null
          let userFound = null


          console.log('test1')

          if (usernameBody || email || phoneNumber) {
            let option;
            if (email) option = { email: email }
            else if (phoneNumber) option = { phoneNumber: phoneNumber }
            else if (usernameBody) option = { username: usernameBody }

            userFound = await User.findOne({ where: option, rejectOnEmpty: true })

            const isPasswordValid = await bcrypt.compare(password, userFound.password)
            if (!isPasswordValid) throw { name: "VinymatiApiInvalidPassword" }
            const { username, role } = userFound
            token = tokenControl.getToken({ username, role })

          } else if (thirdPartToken || appleCode) {
            console.log('test')
            const { ticket: payloadToken, idToken } = appleCode
              ? await verifyThirdPart(null, appleCode, { useBundleId: useBundleId == 'true' ? useBundleId : null }).catch(error => { throw { name: 'ThirdPartApiInternalError' } })
              : await verifyThirdPart(thirdPartToken).catch(error => { throw { name: 'VinymaticApi:ThirdPartLogin:InternalError' } })

            if (!payloadToken.email_verified) throw { name: "VinymaticApi:ThirdPartLogin:EmailMustBeVerified" }

            let option;
            if (/google\.com/.test(payloadToken.iss)) option = { userGoogleId: payloadToken.sub }
            else if (/apple\.com/.test(payloadToken.iss)) option = { userAppleId: payloadToken.sub }


            userFound = await User.findOne({ where: option })
            console.log(option)
            if (!userFound) {
              const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: null })
              await as.doRequest('post', '/third-part-registration', { token: thirdPartToken == null ? idToken : thirdPartToken, appleUser, opts: { useBundleId: useBundleId == 'true' ? useBundleId : null } })

              userFound = await User.findOne({ where: option, rejectOnEmpty: true })
            }

            const { username, role, userGoogleId, userAppleId } = userFound
            if (/google\.com/.test(payloadToken.iss)) token = tokenControl.getToken({ username, role, userGoogleId })
            else if (/apple\.com/.test(payloadToken.iss)) token = tokenControl.getToken({ username, role, userAppleId })
          }

          return res.status(200).json({ id: userFound.id, token })

        } catch (err) {
          // next(err)
          if (
            (err.response && err.response.status == 400) ||
            err.name.localeCompare('VinymaticApi:ThirdPartLogin:InternalError') === 0
          )
            return res.status(400).json({ name: 'VinymaticApi:ThirdPartLogin:InternalError' })

          if (/VinymaticApi:ThirdPartLogin:EmailMustBeVerified/.test(err.name))
            return res.status(401).json({ name: 'VinymaticApi:ThirdPartLogin:EmailMustBeVerified' })

          if (/GoogleApi:InvalidToken/.test(err.name))
            return res.status(401).json({ name: 'GoogleApi:InvalidToken' })

          if (err.name.localeCompare(USER_INVALID_PASSWORD_ERROR) === 0)
            return res.status(401).json({ name: 'Unautorized:PasswordInvalid', message: ErrorMessage.getMessageByStatusCode(401, { isPasswordInvalid: true }) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ name: 'VinymaticApi:ItemNotFound' })

          return res.status(500).json({ name: 'InternalError' })

        }
      })

  router.route('/registration-request')
    .post(
      haveYouThePermission('createOwn', 'user:registration'),
      async (req, res, next) => {
        try {
          const { phoneNumber, email } = req.body
          // if (!phoneNumber && !email) return res.status(400).send({ message: ErrorMessage.getMessageByStatusCode(400, { verifRegister: true }) })
          if (!phoneNumber && !email) throw { name: 'VinymatiApiVerifRegister' }

          if (phoneNumber) {
            const isPhoneNumberExist = await User.findOne({ where: { phoneNumber } })
            // if (isPhoneNumberExist !== null) return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400, { entity: 'phoneNumber' }) })
            if (isPhoneNumberExist !== null) throw { name: 'VinymatiApiAlreadyExist', field: 'phoneNumber' }

            messageBird.verify.create(phoneNumber, {
              template: 'Your verification code is %token',
              timeout: 10 * 60
            }, (err, res1) => {
              // if (err) return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
              if (err) throw new Error()
              return res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { codeSMSVerif: true }), smsId: res1.id })
            })
          }

          if (email) {
            const isEmailExist = await User.findOne({ where: { email } })
            if (isEmailExist !== null) throw { name: 'VinymatiApiAlreadyExist', field: 'email' }

            let emailCode = 0;
            while (emailCode < 100000) {
              emailCode = Math.floor(Math.random() * 999999)
            }
            await VerifEmailUserCode.create({ email, code: emailCode, exp: Tools.newDate(10 * 60), isUsed: false })
            const msg = {
              from: process.env.SEND_GRID_MAIL_SENDER,
              to: email,
              subject: 'Vinymatic - verify your email',
              html: `
              <h1>Hello,</h1>
              <p>Thanks for registering on our mobile application.</p>
              <p>here is the verification code ${emailCode}</p>
            `
            }
            await sgMail.send(msg);
            res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { codeEmailVerif: true }) })
          }
        } catch (err) {
          if (
            err.name.localeCompare(NO_EMAIL_NO_PHONENUMBER_ERROR) === 0 ||
            err.name.localeCompare(ALREADY_EXIST_ERROR) === 0
          ) {
            if (err && err.field)
              return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400, { entity: err.field }) })
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400, { verifRegister: true }) })
          }

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/password-reset-request')
    .post(
      haveYouThePermission('updateOwn', 'user'),
      async (req, res, next) => {
        try {
          const { phoneNumber, email } = req.body
          // if (!phoneNumber && !email) return res.status(400).send({ message: ErrorMessage.getMessageByStatusCode(400, { verifRegister: true }) })
          if (!phoneNumber && !email) throw { name: 'VinymatiApiVerifRegister' }

          if (phoneNumber) {
            let phoneNumFormated = null
            if (/^0\d/.test(phoneNumber)) phoneNumFormated = `+33${phoneNumber.slice(1)}`
            else if (/^\+\d{1,3}/.test(phoneNumber)) phoneNumFormated = phoneNumber

            if (/\.|\s/g.test(phoneNumFormated))
              phoneNumFormated = phoneNumFormated.replace(/\.|\s/g, '')
            await User.findOne({ where: { phoneNumber: phoneNumFormated }, rejectOnEmpty: true })

            messageBird.verify.create(phoneNumFormated, {
              template: 'Your verification code is %token',
              timeout: 10 * 60
            }, (err, res1) => {
              if (err) throw new Error()
              return res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { codeSMSVerif: true }), smsId: res1.id })
            })
          }

          if (email) {
            await User.findOne({ where: { email }, rejectOnEmpty: true })

            let emailCode = 0;
            while (emailCode < 100000) {
              emailCode = Math.floor(Math.random() * 999999)
            }
            await VerifEmailUserCode.create({ email, code: emailCode, exp: Tools.newDate(10 * 60), isUsed: false })
            const msg = {
              from: process.env.SEND_GRID_MAIL_SENDER,
              to: email,
              subject: 'Vinymatic - verify your email',
              html: `
              <h1>Hello,</h1>
              <p>here is the verification code ${emailCode}</p>
            `
            }
            await sgMail.send(msg);
            res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { emailVerif: true }) })
          }
        } catch (err) {
          if (err.name.localeCompare(NO_EMAIL_NO_PHONENUMBER_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400, { verifRegister: true }) })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/password-reset')
    .patch(
      haveYouThePermission('updateOwn', 'user'),
      async (req, res, next) => {
        try {
          const { username, email, phoneNumber, newPassword } = req.body;
          let option;
          if (email) option = { email: email }
          else if (phoneNumber) option = { phoneNumber: phoneNumber }
          else if (username) option = { username: username }

          const user = await User.findOne({ where: option, rejectOnEmpty: true })

          user.password = newPassword;
          user.emailToken = null;
          await user.save();

          res.status(200).json({ message: ErrorMessage.getMessageByStatusCode(200, { isPasswordChanged: true }) })

        } catch (err) {
          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }
      })

  router.route('/verify-code')
    .patch(
      haveYouThePermission('createOwn', 'user:registration'),
      async (req, res, next) => {
        try {
          const { email: emailToAdd, smsId, code: codeToVerif } = req.body

          if (!smsId && !emailToAdd) throw { name: 'VinymatiApiVerifRegister' }
          if (!codeToVerif) {
            return res.status(401).json({ message: `You must send a code` });
          }
          if (emailToAdd) {
            const verifyEmail = await VerifEmailUserCode.findOne({ where: { email: emailToAdd }, order: [['createdAt', 'DESC']], rejectOnEmpty: true })
            // const verifyCode = await VerifEmailUserCode.findOne({ where: { email: emailToAdd }, order: [['createdAt', 'DESC']] })
            if (verifyEmail.exp < Tools.newDate()) throw { name: 'VinymatiApiCodeExpired' }
            if (verifyEmail.code != codeToVerif) throw { name: 'VinymatiApiCodeInvalid' }
            if (verifyEmail.isUsed) throw { name: 'VinymatiApiAlreadyUsedCodeInvalid' }

            await VerifEmailUserCode.update({ isUsed: true }, { where: { id: verifyEmail.id } })
            return res.status(200).send(true)
          }

          if (smsId) {
            messageBird.verify.verify(smsId, codeToVerif, async (err, res1) => {
              if (err) {
                switch (true) {
                  case /the token has expired/i.test(err.message):
                    throw { name: 'VinymatiApiCodeExpired' }
                  case /the token has already been processed/i.test(err.message):
                    throw { name: 'VinymatiApiAlreadyUsedCodeInvalid' }
                  default: throw new Error(); break;
                }
              }
              return res.status(200).send(true)
            })
          }
        } catch (err) {
          if (err.name.localeCompare(NO_EMAIL_NO_PHONENUMBER_ERROR) === 0)
            return res.status(400).json({ message: ErrorMessage.getMessageByStatusCode(400, { verifRegister: true }) })

          if (err.name.localeCompare(ALREADY_USED_CODE_ERROR) === 0)
            return res.status(401).json({ message: 'Le code a déjà été utilisé' })

          if (err.name.localeCompare(INVALID_CODE_ERROR) === 0)
            return res.status(401).json({ message: 'Le code est invalid' })

          if (err.name.localeCompare(EXPIRED_CODE_ERROR) === 0)
            return res.status(401).json({ message: 'Le code a expiré' })

          if (err.name.localeCompare(EMPTY_ERROR) === 0)
            return res.status(404).json({ message: ErrorMessage.getMessageByStatusCode(404) })

          return res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })

        }
      })

  router.route('/refresh-token')
    .patch(
      // haveYouThePermission('updateOwn', 'user:token:refresh'),
      async (req, res, next) => {
        try {
          const { body: { token } } = req
          const refreshedToken = refresh(token)
          if (token === false) throw { name: 'VinymaticApiNotLoggedIn' }
          res.status(200).json({ token: refreshedToken })
        } catch (error) {
          if (error.name.localeCompare('VinymaticApiNotLoggedIn') === 0)
            res.status(401).json({ message: 'User is not logged in' })

          res.status(500).json({ message: ErrorMessage.getMessageByStatusCode(500) })
        }

      })

  router.route('/callbacks/sign_in_with_apple')
    .post(
      async (req, res, next) => {
        const { body } = req
        // const redirect = `intent://callback?${new URLSearchParams(body).toString()}#Intent;package=${ANDROID_PACKAGE_IDENTIFIER};scheme=signinwithapple;end`;
        const redirect = `intent://callback?${new URLSearchParams(body).toString()}#Intent;package=com.vinymatic;scheme=signinwithapple;end`;

        console.log('Apple Callback Boby', body);
        console.log(`Redirecting to ${redirect}`);
        console.log('req', req)
        // console.log('res', res)


        res.redirect(307, redirect);
      });

}

