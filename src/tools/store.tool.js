const fs = require('fs')
const { PWD } = process.env



const getValueSql = () => {
  return new Promise((resolve, reject) => {
    try {
      const data = fs.readFileSync(`${PWD}/src/tools/store.sql`).toString();
      const lines = data.split(/\r?\n/);

      resolve(lines)
    } catch (err) {
      reject(err);
    }
  })
}
const prepareRequest = (sql) => {
  const prepare = sql.replace("\\\”", "\"")
  return 'INSERT INTO `Stores` (`id`, `placeId`, `name`, `descript`, `images`, `formattedAddress`, `geometry`, `rating`, `userRatingsTotal`, `hours`, `contacts`, `types`, `genres`, `formats`, `styles`, `mainSells`, `otherSells`, `createdAt`, `updatedAt`) VALUES ' + prepare;
}


module.exports = { getValueSql, prepareRequest }


