const objToCsv = require('objects-to-csv')

module.exports = async (err, req, res, next) => {
  const { message, status } = err
  let { url, body } = req
  let { statusCode, statusMessage } = res
  statusCode = `${statusCode}`

  const finalMessage = message || statusMessage
  const toCsv = []
  if (err) {
    toCsv.push({
      status: statusCode || '-',
      message: finalMessage || '-',
      resource_url: url || '-',
      body: body || '-'
    })

    const otc = new objToCsv(toCsv);
    await otc.toDisk('./src/error/errorFromSraping.csv', { append: true })
  }

  if (status)
    res.status(status).json()
}