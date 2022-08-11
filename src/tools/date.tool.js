module.exports = {
  dateFormaterStringToTimestamp: (dateString) => {
    let date
    let matchDate
    switch (true) {
      case /^\d{2,4}(?:\-|\/)\d{1,2}(?:\-|\/)\d{1,2}$/.test(dateString):
        matchDate = dateString.match(/^(?<year>\d{2,4})(?:\-|\/)(?<month>\d{1,2})(?:\-|\/)(?<day>\d{1,2})$/).groups
        if (matchDate.month === '00') matchDate.month = '01'
        if (matchDate.day === '00') matchDate.day = '01'
        date = `${matchDate.year}-${matchDate.month}-${matchDate.day}`
        break;
      case /^\d{1,2}(?:\-|\/)\d{1,2}(?:\-|\/)\d{2,4}$/.test(dateString):
        matchDate = dateString.match(/^(?<day>\d{1,2})(?:\-|\/)(?<month>\d{1,2})(?:\-|\/)(?<year>\d{2,4})$/).groups
        date = `${matchDate.year}-${matchDate.month}-${matchDate.day}`
        break;
      case /^\d{2,4}$/.test(dateString):
        matchDate = `${dateString}`.match(/^(?<year>\d{2,4})$/).groups
        date = `${matchDate.year}-01-01`
        break;
      default:
        console.log('le format de la date est inconnu ');
        throw { name: 'VinymaticApiInvalidDate' }
    }

    return new Date(date).toISOString().slice(0, 10);
  },
  dateFormaterTimestampToString: (timestamp) => {
    const date = new Date(timestamp * 1000);

    return `${date.getFullYear()} -${date.getMonth()} -${date.getDate()} `
      .split('-')
      .map(el => {
        switch (true) {
          case /^\d{1}$/.test(el): return `0${el} `;
          default: return el
        }
      })
      .join('-')
  }

}