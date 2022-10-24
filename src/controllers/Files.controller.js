const fs = require('fs')
const util = require('util')
const unlinkFile = util.promisify(fs.unlink)

const BucketS3Service = require('../files/s3')

module.exports = {
  PostAudioController: async (file, params = {}) => {
    const { typeAudio, idAudio, positionAudio } = params
    let { titleAudio } = params
    titleAudio = titleAudio.replace(/\s/g, '_').replace(/\//g, '-')

    let filename = `${titleAudio}_${idAudio}I${Date.now()}D${positionAudio}P.mp3`

    const path = `${typeAudio}/${encodeURIComponent(filename)}`

    const bucketS3Service = new BucketS3Service('audio')
    const uploadResult = await bucketS3Service.uploadFile(path, file)
    await unlinkFile(file.path)

    return { url: `/song/${uploadResult.Key}` }
  }
}