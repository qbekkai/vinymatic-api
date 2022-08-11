const moment = require('moment')

module.exports = {
  toSeconds: (ms) => { return moment.duration(ms).asSeconds() },
  toMinutes: (ms) => {
    const s = `${moment.duration(ms).seconds()}`.length === 1
      ? `0${moment.duration(ms).seconds()}`
      : `${moment.duration(ms).seconds()}`
    return +`${moment.duration(ms).minutes()}.${s}`
  }
}