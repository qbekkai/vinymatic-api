const { URL_API, PORT_API, TOKEN_API } = process.env

const fs = require('fs')
const FormData = require('form-data');

const ApiService = require('../services/apiService')
const LARGE = 'large'


module.exports = {
  getImageUrl: async (urlImage, options = {}) => {
    let resImage
    const { imageFrom, typeImage, id_, name, positionImage } = options
    const nameImage = name.replace(/\s/g, '_').replace(/\//g, '-')
    const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
    const apiUrl = `/images/scraping?url=${urlImage}&imageFrom=${imageFrom}&typeImage=${typeImage}&id_=${id_}&name=${nameImage}`

    if (positionImage && typeImage && typeImage === LARGE)
      resImage = await as.doRequest('POST', `${apiUrl}&positionImage=${positionImage}`)
    else
      resImage = await as.doRequest('POST', apiUrl)
    return resImage
  },

  deleteImageUrl: async (urlImage) => {
    try {
      const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
      if (/object|array/.test(typeof urlImage)) {
        for (url of urlImage)
          await as.doRequest('DELETE', url)
      } else
        await as.doRequest('DELETE', urlImage)

      return true
    } catch (error) {
      return false
    }
  },

  // uploadImageFile: async (files, imageFrom, options) => {
  //   const item = {}
  //   const { itemDb, itemAd } = options
  //   const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
  //   let file, others
  //   let resImage

  //   if (files) [file, ...others] = files

  //   if (file && file.fieldname || itemAd) {
  //     const typeImage = file ? file.fieldname : Object.keys(itemAd).find(element => /^thumbnail|profilImage|coverImage|image$/.test(element));
  //     if (/^thumbnail|profilImage|coverImage|image$/.test(typeImage)) {

  //       // DELETE IF NULL
  //       const thumbToDelete = itemDb.thumbnail
  //       await as.doRequest('DELETE', thumbToDelete)


  //       if (file) {
  //         const fd = new FormData()
  //         fd.append('image', fs.createReadStream(file.path))
  //         fd.append('imageFrom', `${imageFrom}s`)
  //         fd.append('typeImage', `${typeImage}s`)
  //         fd.append('id_', itemDb.id)
  //         if (itemDb && itemDb.username) fd.append('name', itemDb.username)
  //         if (itemDb && itemDb.name) fd.append('name', itemDb.name)
  //         if (itemDb && itemDb.title) fd.append('name', itemDb.title)

  //         resImage = await as.doRequest('POST', `/images`, fd)
  //       }
  //       item[typeImage] = resImage ? resImage.data.url : null
  //     }


  //     if (/^images$/.test(typeImage)) {
  //       let positionImage = 1
  //       const largeImages = [];

  //       for (const file of files) {

  //         // DELETE IF NULL

  //         const fd = new FormData()
  //         fd.append('image', fs.createReadStream(file.path))
  //         fd.append('imageFrom', imageFrom)
  //         fd.append('typeImage', 'large')
  //         fd.append('id_', itemDb.id)
  //         if (itemDb && itemDb.name) fd.append('name', itemDb.name)
  //         if (itemDb && itemDb.title) fd.append('name', itemDb.title)
  //         fd.append('positionImage', positionImage)
  //         positionImage += 1

  //         const resSong = await as.doRequest('POST', `/images`, fd)
  //         largeImages.push(resSong.data.url)
  //       }
  //       item.images = largeImages
  //     }
  //   }

  //   return item
  // },

  getOptionForuploadImageFile: (files, imageFrom, itemDb = null, itemAd) => {
    const options = {}
    options.itemDb = itemDb
    options.itemAd = itemAd
    const file = files instanceof Array ? files.shift() : null

    if (file) {
      const key = file.fieldname
      if (/^image|thumbnail$/.test(key)) {
        switch (true) {
          case (!!(file && !itemAd[key] && !itemDb[key])):
            options.method = 'post';
            options.files = [file]
            options.imageFrom = imageFrom
            break;
          case (!!(file && !itemAd[key] && itemDb[key])):
            options.method = 'patch';
            options.files = [file]
            options.imageFrom = imageFrom

            break;
          default: break;
        }
      } else if (/^profilImage|coverImage$/.test(key)) {
        options.method = 'post';
        options.files = [file]
        options.imageFrom = imageFrom
      }
    } else {
      options.method = 'delete';
    }

    return options
  },

  uploadImageFile: async ({ method, files, imageFrom, itemDb, itemAd }) => {
    const item = {}
    const as = new ApiService({ baseURL: `${URL_API}:${PORT_API}`, token: TOKEN_API })
    let typeImage, file, others
    if (files) [file, ...others] = files

    switch (true) {
      case /delete|patch/i.test(method):
        typeImage = file && file.fieldname ? file.fieldname : Object.keys(itemAd).find(element => /^thumbnail|profilImage|coverImage|image$/.test(element));
        if (/^thumbnail|profilImage|coverImage|image$/.test(typeImage)) {
          const thumbToDelete = itemDb[typeImage]
          await as.doRequest('DELETE', thumbToDelete)

          if (/delete/i.test(method)) {
            item[typeImage] = null;
            break;
          }
        }
      case /post/i.test(method):
        if (file && file.fieldname) {
          const typeImage = file.fieldname
          if (/^thumbnail|profilImage|coverImage|image$/.test(typeImage)) {
            const fd = new FormData()
            fd.append('image', fs.createReadStream(file.path))
            fd.append('imageFrom', `${imageFrom}s`)
            fd.append('typeImage', `${typeImage}s`)
            fd.append('id_', itemDb.id)
            if (itemAd && itemAd.username) fd.append('name', itemAd.username); else if (itemDb && itemDb.username) fd.append('name', itemDb.username);
            if (itemAd && itemAd.name) fd.append('name', itemAd.name); else if (itemDb && itemDb.name) fd.append('name', itemDb.name);
            if (itemAd && itemAd.title) fd.append('name', itemAd.title); else if (itemDb && itemDb.title) fd.append('name', itemDb.title);

            const resImage = await as.doRequest('POST', `/images`, fd)
            item[typeImage] = resImage.data.url
          }
        }

        if (/^images$/.test(typeImage)) {
          let positionImage = 1
          const largeImages = [];

          for (const file of files) {

            // DELETE IF NULL

            const fd = new FormData()
            fd.append('image', fs.createReadStream(file.path))
            fd.append('imageFrom', imageFrom)
            fd.append('typeImage', 'large')
            fd.append('id_', itemDb.id)
            if (itemDb && itemDb.name) fd.append('name', itemDb.name)
            if (itemDb && itemDb.title) fd.append('name', itemDb.title)
            fd.append('positionImage', positionImage)
            positionImage += 1

            const resSong = await as.doRequest('POST', `/images`, fd)
            largeImages.push(resSong.data.url)
          }
          item.images = largeImages
        }
        break;
      default: break;
    }
    return item
  }
}