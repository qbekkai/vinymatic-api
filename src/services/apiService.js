const axios = require("axios");

class ApiService {

  constructor({ baseURL, token }) {
    this.baseURL = baseURL
    this.token = token
  }

  async doRequest(method, url, data = null) {
    return await axios(this.requestOptions(method, url, data))
  }

  requestOptions(method, url, data = null) {
    const options = {
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    };
    options.baseURL = this.baseURL;
    options.responseType = 'json';
    options.url = encodeURI(url);
    if (this.token) axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;

    if (/post|patch/i.test(method) && (/\/(?:images|audios|registration)$/i.test(url) || /\/(?:song|video)/i.test(url)) && data) {
      options.headers = data.getHeaders()
    }

    switch (true) {
      case /post/i.test(method): options.method = 'POST'; break;
      case /get/i.test(method): options.method = 'GET'; break;
      case /update|put|patch/i.test(method): options.method = 'PATCH'; break;
      case /delete/i.test(method): options.method = 'DELETE'; break;
      default: break;
    }

    if (data) options.data = data;
    return options;
  }
}

module.exports = ApiService;