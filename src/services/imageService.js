const { URL_API, PORT_API, TOKEN_API } = process.env
const ApiService = require('./../services/apiService')
const FileService = require('./fileService')

/** TODO : Use extend Class FileService */
module.exports = class ImageService extends FileService {
  // module.exports = class ImageService {
  constructor(files) {
    super('', files || null)
    this._as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
  }

  getApiService() { return this._as }


  createFormData(file, imageFrom, typeImage, id_, options = {}) {
    const fs = require('fs')
    const FormData = require('form-data')
    const { username = null, name = null, title = null, positionImage = null } = options

    const fd = new FormData()
    fd.append('image', fs.createReadStream(file.path))
    fd.append('imageFrom', `${imageFrom}s`)
    fd.append('typeImage', `${typeImage}s`)
    fd.append('id_', id_)

    if (username) fd.append('username', username)
    if (name) fd.append('name', name)
    if (title) fd.append('name', title)
    if (positionImage) fd.append('positionImage', positionImage)

    return fd
  }

  async uploadArrayImageFiles({ imageFrom, typeImage, itemDb, itemAd }) {
    const as = this.getApiService()
    super.setMethod(typeImage, itemDb, itemAd)

    const files = super.getFiles()
    const method = super.getMethod()
    let positionImage = 1
    const largeImages = [];

    switch (true) {
      case /delete|patch/i.test(method):
        if (itemDb.images) {
          for (const file of itemDb.images) {
            await as.doRequest('DELETE', file)
          }
        }
        if (/delete/i.test(method)) return { images: null }
      case /post/i.test(method):
        for (const file of files) {
          const options = super.getOptionsForFD(itemDb, itemAd, { positionImage })
          const fd = this.createFormData(file, imageFrom, typeImage, itemDb.id, options)
          positionImage += 1

          const resSong = await as.doRequest('POST', `/images`, fd)
          largeImages.push(resSong.data.url)
        }
        break
    }

    return { images: largeImages }
  }

  async deleteArrayImageFiles(imageFrom, { itemDb, itemAd }) {

  }

  uploadOneImageFile() {
    const file = this.getFile()
  }
}