const { URL_API, PORT_API, TOKEN_API } = process.env
const ApiService = require('./apiService')
const FileService = require('./fileService')


module.exports = class VideoService extends FileService {
  constructor(files) {
    super('', files || null)
  }

  createFormData(file, videoFrom, typeVideo, id_, options = {}) {
    const fs = require('fs')
    const FormData = require('form-data')
    const { title = null } = options

    const fd = new FormData()
    fd.append('videoFile', fs.createReadStream(file.path))
    fd.append('videoFrom', `${videoFrom}s`)
    fd.append('typeVideo', `${typeVideo}s`)
    fd.append('idVideo', id_)

    if (title) fd.append('title', title)

    return fd
  }

  async uploadAVideoFile({ videoFrom, typeVideo = "video", itemDb, itemAd }) {
    const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })

    super.setMethod(typeVideo, itemDb, itemAd)

    const file = super.getFile()
    const method = super.getMethod()
    let videoUrl = null

    switch (true) {
      case /delete|patch/i.test(method):
        await as.doRequest('DELETE', file)
        if (/delete/i.test(method)) return { video: null }
      case /post/i.test(method):
        const options = super.getOptionsForFD(itemDb, itemAd)
        const fd = this.createFormData(file, videoFrom, typeVideo, itemDb.id, options)

        const videoUploaded = await as.doRequest('POST', `/files/video`, fd)
        videoUrl = videoUploaded.data.url
        break
    }

    return { video: { videoUrl } }
  }
}