const { ID_CLIENT_WEBAPP, ID_CLIENT_IOS, ID_CLIENT_ANDROID } = process.env
const path = require('path')
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');
const jwt = require('jsonwebtoken')


async function verifyThirdPart(token, appleCode = null, opts = {}) {
  return new Promise(
    async (resolve, reject) => {
      try {
        let appleAuthToken = null, idToken = null;
        const { useBundleId } = opts

        if (appleCode) {
          const code = appleCode
          const clientSecret = appleSignin.getClientSecret({
            clientID: useBundleId == 'true' ? 'com.vinymatic' : 'com.vinymatic.app', // Apple Client ID
            teamID: '3YKVX5VCGD', // Apple Developer Team ID.
            privateKeyPath: path.join(process.cwd(), '/AuthKey_3JRUTL5X3F.p8'), // private key associated with your client ID. -- Or provide a `privateKeyPath` property instead.
            keyIdentifier: '3JRUTL5X3F', // identifier of the private key.
          });


          const optionsAppleAuth = {
            clientID: useBundleId == 'true' ? 'com.vinymatic' : 'com.vinymatic.app', // Apple Client ID
            redirectUri: 'https://test.api.vinymatic.com/callbacks/sign_in_with_apple', // use the same value which you passed to authorisation URL.
            clientSecret: clientSecret
          }
          appleAuthToken = await appleSignin.getAuthorizationToken(code, optionsAppleAuth)
        }
        idToken = token == null ? appleAuthToken.id_token : token
        let decodeToken = jwt.decode(idToken)

        let ticket = null, client = null

        if (/google\.com/.test(decodeToken.iss)) {
          switch (true) {
            case decodeToken.aud === ID_CLIENT_IOS || decodeToken.azp === ID_CLIENT_IOS:
              client = new OAuth2Client(ID_CLIENT_IOS);
              break;
            case decodeToken.aud === ID_CLIENT_WEBAPP || decodeToken.azp === ID_CLIENT_WEBAPP:
              client = new OAuth2Client(ID_CLIENT_WEBAPP);
              break;
            case decodeToken.aud === ID_CLIENT_ANDROID || decodeToken.azp === ID_CLIENT_ANDROID:
              client = new OAuth2Client(ID_CLIENT_ANDROID);
              break;
            default: return reject({ name: 'GoogleApi:InvalidToken' })
          }

          ticket = await client.verifyIdToken({ idToken: token, audience: [ID_CLIENT_ANDROID, ID_CLIENT_IOS, ID_CLIENT_WEBAPP] });
          return resolve({ ticket: ticket.getPayload() })

        } else if (/apple\.com/.test(decodeToken.iss)) {
          ticket = await appleSignin.verifyIdToken(
            idToken, // We need to pass the token that we wish to decode.
            {
              audience: useBundleId == 'true' ? 'com.vinymatic' : 'com.vinymatic.app', // client id - The same one we used  on the frontend, this is the secret key used for encoding and decoding the token.
              ignoreExpiration: true, // Token will not expire unless you manually do so.
            }
          );
          return resolve({ ticket, idToken })
        }
      } catch (error) {
        console.log('VinymaticApi:ThirdPartLogin:VerifyToken', error)
        reject({ name: 'VinymaticApi:ThirdPartLogin:VerifyToken' })
      }
    }
  )
}

module.exports = verifyThirdPart;