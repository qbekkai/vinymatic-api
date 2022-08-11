const { PWD } = process.env
const xlsx = require('xlsx')

const loadFile = (file) => {
	return new Promise((resolve, reject) =>{
		const workbook = xlsx.readFile(`${PWD}/${file.path}`)
		const worksheet = workbook.Sheets[workbook.SheetNames[0]]
		resolve({worksheet, workbook})
	})
} 

const getLineData = (worksheet, line) => {
	return {
		title: worksheet[`C${line}`]?.v,
		description: worksheet[`K${line}`]?.v,
		price: worksheet[`I${line}`]?.v,
		devise: 'EUR',
		quantity: worksheet[`Q${line}`]?.v,
		vinylId:  worksheet[`G${line}`]?.v,
		status: worksheet[`H${line}`]?.v,
		mediaCondition: worksheet[`L${line}`]?.v,
		sleeveCondition: worksheet[`M${line}`]?.v
	}
}

const getEmptyLineIndex = (worksheet) => {
	return Object.keys(worksheet).filter(a => a.match(/B/)).length + 1
}


module.exports = { loadFile, getLineData, getEmptyLineIndex }
