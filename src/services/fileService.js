const { URL_API, PORT_API, TOKEN_API } = process.env
const ApiService = require('./apiService')


module.exports = class FileService {
  constructor(method, files) {
    this.method = method
    this.files = files
  }

  getMethod() { return this.method }
  getFiles() { return this.files }
  getFile() { return this.files.shift() }

  getTypeOfFiles() {
    const type = "";
    const files = this.getFiles()

    switch (true) {
      case typeof files === "string":
        type = "string"
        break;
      case typeof files === "object":
        if (Array.isArray(files)) type = "array"
        else type = "object"
        break;
      default: break;
    }
    return type
  }

  getOptionsForFD(itemDb, itemAd, { positionImage } = {}) {
    const options = {}

    if (!!itemAd.name) options.name = itemAd.name;
    else if (!!itemDb.name) options.name = itemDb.name;

    if (!!itemAd.username) options.username = itemAd.username;
    else if (!!itemDb.username) options.username = itemDb.username;

    if (!!itemAd.title) options.title = itemAd.title;
    else if (!!itemDb.title) options.title = itemDb.title;

    if (positionImage) options.positionImage = positionImage

    return options
  }

  setMethod(typeFile, itemDb, itemAd) {
    const files = this.getFiles()

    switch (true) {
      case (!!(!files && itemAd[typeFile] === '' && itemDb[typeFile] !== '')):
        this.method = 'delete';
        break;
      case (!!(files && !itemAd[typeFile] && !itemDb[typeFile])):
        this.method = 'post';
        break;
      case (!!(files && !itemAd[typeFile] && itemDb[typeFile])):
        this.method = 'patch';
        break;
      default: break;
    }
  }

  // createFormData(file, id_, options = {}) {
  //   const fs = require('fs')
  //   const FormData = require('form-data')
  //   const { imageFrom = null, typeImage = null, audioFrom = null, typeAudio = null, videoFrom = null, typeVideo = null, username = null, name = null, title = null, positionImage = null } = options

  //   const fd = new FormData()
  //   fd.append('image', fs.createReadStream(file.path))
  //   fd.append('video', fs.createReadStream(file.path))
  //   if (imageFrom) fd.append('imageFrom', `${imageFrom}s`)
  //   if (typeImage) fd.append('typeImage', `${typeImage}s`)
  //   if (audioFrom) fd.append('audioFrom', `${audioFrom}s`)
  //   if (typeAudio) fd.append('typeAudio', `${typeAudio}s`)
  //   if (videoFrom) fd.append('videoFrom', `${videoFrom}s`)
  //   if (typeVideo) fd.append('typeVideo', `${typeVideo}s`)
  //   fd.append('id_', id_)

  //   if (username) fd.append('username', username)
  //   if (name) fd.append('name', name)
  //   if (title) fd.append('title', title)
  //   if (positionImage) fd.append('positionImage', positionImage)

  //   return fd
  // }
}