if (/prod/i.test(process.env.NODE_ENV))
  require('dotenv').config({ path: '.././.env.prod' })
else if (/test/i.test(process.env.NODE_ENV))
  require('dotenv').config({ path: '.././.env.test' })
else
  require('dotenv').config({ path: '.././.env.local' })


const fs = require('fs')
const S3 = require('aws-sdk/clients/s3')




class BucketS3Service {
  constructor(typeFile) {
    this.accessKeyId = process.env.AWS_ACCESS_KEY
    this.secretAccessKey = process.env.AWS_SECRET_KEY
    this.bucketName = process.env[`AWS_BUCKET_NAME_${typeFile.toUpperCase()}`]
    this.region = process.env[`AWS_BUCKET_REGION_${typeFile.toUpperCase()}`]

    this.s3 = new S3({
      region: this.region,
      accessKeyId: this.accessKeyId,
      secretAccessKey: this.secretAccessKey
    })
  }

  uploadFile(path, file) {
    const fileStream = fs.createReadStream(file.path)
    const uploadParams = {
      Bucket: this.bucketName,
      Body: fileStream,
      Key: path
    }
    return this.s3.upload(uploadParams).promise()
  }

  async getFile(fileKey, options = {}) {
    const { isGetDuration } = options

    const downloadParams = {
      Key: fileKey,
      Bucket: this.bucketName
    }

    const dataStream = await this.s3.getObject(downloadParams);

    if (!isGetDuration || (isGetDuration && isGetDuration === "false")) return dataStream.createReadStream();
    else { return await dataStream.promise(); }
  }

  async deleteFile(fileKey) {
    try {
      const params = {
        Key: fileKey,
        Bucket: this.bucketName
      }

      return await this.s3.deleteObject(params).promise()
    } catch (error) {
      throw error
    }
  }

  async renameFile(oldName, newName) {
    try {
      const BUCKET_NAME = this.bucketName;
      const OLD_KEY = oldName;
      const NEW_KEY = newName;

      const params = {
        Bucket: BUCKET_NAME,
        CopySource: `${BUCKET_NAME}/${OLD_KEY}`,
        Key: NEW_KEY
      }

      const copy = await this.s3.copyObject(params).promise()

      await this.s3.deleteObject({
        Bucket: BUCKET_NAME,
        Key: OLD_KEY
      }).promise()
      return copy
    } catch (error) {
      throw error
    }
  }
}


module.exports = BucketS3Service




/**









curl --range 0-99 https://test.api.vinymatic.com/song/songs/Wanna_Be_Startin'_Somethin'_1206I1647013289873DA1P.mp3 -o /dev/null

Wanna_Be_Startin'_Somethin'_1206I1647013289873DA1P.mp3

 */