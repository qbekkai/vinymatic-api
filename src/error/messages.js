class ErrorMessage {
  constructor() { }

  getMessageByStatusCode(statusCode, options = {}) {
    /**
      options = {
        isPasswordChanged
        emailVerif
        iscodeSMSVerif
        codeSMSVerif
        userLoggedIn
        fileUpload
        isUsernameExist
        updatedRessource
        deletedRessource
        verifRegister
        isPasswordInvalid
        isLogIn
        isEmailNonExist
        isUsernameNonExist
      }
     */

    /** TODO: COMPLETER LES MESSAGE D'ERREUR */
    let msg = '';
    switch (statusCode) {
      case 200:
        switch (true) {
          case options.isPasswordChanged: msg = `The password has been changed.`; break;
          case options.codeEmailVerif: msg = `An email has been sent.`; break;
          case options.iscodeSMSVerif: msg = `The phone number has been verified.`; break;
          case options.codeSMSVerif: msg = `An SMS has been sent.`; break;
          case options.userLoggedIn: msg = `The user is successfully logged in.`; break;
          case options.fileUpload: msg = `The file has been successfully uploaded.`; break;
          case options.isUsernameExist: msg = `This username is available.`; break;
          case options.updatedRessource: msg = `The resource has been successfully updated.`; break;
          case options.deletedRessource: msg = `The resource has been successfully deleted.`; break;
          default: msg = `The resource has been successfully retrieved.`; break;
        }
        break;
      case 201: msg = `The resource has been successfully created.`; break;

      case 400:
        switch (true) {
          case options.verifRegister: msg = `Your phone number or email is missing.`; break;
          default:
            if (options.err) {
              const error = options.err.errors[0]
              switch (true) {
                case /notNull Violation/i.test(error.type): msg = `The “${error.path}“ field can't be not null.`; break;
                default: break;
              }
            } else msg = `The ${options.entity ? options.entity : null} you want to add already exists.`;
            break;
        }
        break;
      case 401:
        switch (true) {
          case options.expiredToken: msg = `Your session expired.`; break;
          case options.isPasswordInvalid: msg = `The password is incorrect.`; break;
          case options.isLogIn: msg = `The user is not authorized to access this resource.`; break;
          default: msg = `The user is not logged in.`; break;
        }
        break;
      case 403: msg = `You do not have access to this resource.`; break;
      case 404:
        switch (true) {
          case options.isEmailNonExist: msg = `The email is not filled in.`; break;
          case options.isUsernameNonExist: msg = `This username is unavailable.`; break;
          default: msg = `The requested resource does not exist.`; break;
        }
        break;
      case 500: msg = `An error has occurred. Please try again later.`; break;
      default: break;
    }
    return msg
  }
}

module.exports = new ErrorMessage()