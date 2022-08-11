const jwt = require("jsonwebtoken");
const privateKey = require("../auth/privateKey").privateKey;

module.exports = {
  getToken: (data) => {
    let token = "";
    for (const key of Object.keys(data)) {
      const value = data[key];
      switch (true) {
        case /username/i.test(key):
          if (
            value.localeCompare("scraping") === 0 ||
            value.localeCompare("admin") === 0
          )
            token = jwt.sign(data, privateKey, {
              expiresIn: 60 * 60 * 24 * 365,
            });
          else
            token = jwt.sign(data, privateKey, { expiresIn: 60 * 60 * 24 * 7 });
          break;
        default:
          break;
      }
    }
    return token;
  },
  decodeToken: (token) => {
    return jwt.verify(token, privateKey, (error, decodedToken) => {
      if (error) return new Error(error.message);
      return decodedToken;
    });
  },
  refresh: (token, options = {}) => {
    const payload = jwt.verify(token, privateKey);

    if (Date.now() <= payload.exp * 1000) {
      delete payload.iat;
      delete payload.exp;

      for (const key of Object.keys(payload)) {
        const value = payload[key];
        switch (true) {
          case /username/i.test(key):
            if (
              value.localeCompare("scraping") === 0 ||
              value.localeCompare("admin") === 0
            )
              return jwt.sign(payload, privateKey, {
                expiresIn: 60 * 60 * 24 * 365,
              });
            else
              return jwt.sign(payload, privateKey, { expiresIn: 60 * 60 * 24 * 7 });
            break;
          default:
            break;
        }
      }
    }

    return false
  },
};
