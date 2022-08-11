// const { getImageUrl } = require('./images.tool')
const imageTools = require('./images.tool')
const ImageService = require('./../services/imageService')


module.exports = class ImageManagement {
  constructor(urls = {}, entity = '', options = {}) {
    this._returnImages = {}
    this._urls = urls;
    this._entity = entity
    this._options = options
    this._error = null

    // const isValide = this.validation()
    // if (!isValide) return { isError: true, name: 'VinymaticImagesNotValid', code: this._error.code }

    // this.validation()
    //   .then(function (isValide) {
    //     console.log('OK');
    //     // if (!isValide) return { isError: true, name: 'VinymaticImagesNotValid', code: this._error.code }
    //   })
    //   .catch(err => {
    //     return { isError: true, name: 'VinymaticImagesNotValid', code: err }
    //   })
  }


  setError(value) { this._error = value }
  setReturnUrl(images) { this._returnImages = images }

  getError() { return this._error }
  getUrls() { return this._urls }
  getThumbUrls() { return this._urls.thumbnail }
  getFirstLargeUrl() { return this._urls.images && this._urls.images.length && this._urls.images.length > 0 ? this._urls.images[0] : "" }
  getLargeUrls() { return this._urls.images }
  getEntity() { return this._entity }
  getOpions() { return this._options }
  getIsFromScraping() {
    const options = this.getOpions()
    return options && options.isFromScraping
      ? options.isFromScraping
      : false
  }
  getDbItem() {
    const options = this.getOpions()
    return options && options.dbItem
      ? options.dbItem
      : null
  }
  getToPostItem() {
    const options = this.getOpions()
    return options && options.toPostItem
      ? options.toPostItem
      : null
  }


  async validation() {
    return new Promise((resolve, reject) => {
      const thumbnail = this.getThumbUrls()
      const image = this.getFirstLargeUrl()
      // const isThumbValid = await this.validationItem(thumbnail)
      // const isImagesValid = await this.validationItem(image)

      // if (!isThumbValid || !isImagesValid) return false
      // return true

      Promise.all([
        this.validationItem(thumbnail, "thumbnail"),
        this.validationItem(image, "images")
      ])
        .then((validator) => {
          const validated = validator.filter(e => typeof (e) != 'boolean')
          if (validated.length > 0) reject({ code: 'NOT_VALIDATED', validator })
          resolve(true)
        })
        .catch(err => { reject({ code: 'NOT_VALIDATED', err }) })
      // console.log(validator)
      // const validated = validator.filter(e => typeof (e) != 'boolean')
      // if (validated.length > 0) return { code: 'NOT_VALIDATED', validator }
      // resolve(true)
    })
  }

  // validationItem(item) {
  //   if (item === null) {
  //     this.setError({ code: 'NOT_EXIST_ERROR' })
  //     return false
  //   } else {
  //     const isForScraping = this.getIsFromScraping()
  //     if (isForScraping && !(/discogs/i.test(item))) {
  //       this.setError({ code: 'IS_NOT_DISCOGS_URL_ERROR' })
  //       return false
  //     }
  //     if (item.lenght < 1) {
  //       this.setError({ code: 'EMPTY_ERROR' })
  //       return false
  //     }
  //     return true
  //   }
  // }

  validationItem(item, typeImage) {
    return new Promise((resolve, reject) => {
      if (item === "" || (item && item.length && item.length === 0)) {
        resolve({ code: 'NOT_IMAGE_ERROR', typeImage })
      } else {
        const isForScraping = this.getIsFromScraping()
        if (!item) return resolve({ code: 'NOT_EXIST_ERROR', typeImage })
        if (isForScraping && !(/discogs/i.test(item))) {
          resolve({ code: 'IS_NOT_DISCOGS_URL_ERROR', typeImage })
        }
        if (item.length < 1) {
          resolve({ code: 'EMPTY_ERROR', typeImage })
        }
        resolve(true)
      }
    })
  }

  async postAllImages() {
    const isForScraping = this.getIsFromScraping()
    if (isForScraping) {
      return await this.postScraping()
    } else {
      console.log('With Files');
    }
  }

  async postScraping() {
    const entity = this.getEntity()
    let resImage = {}

    switch (true) {
      case /vinyl|master|label|artist/.test(entity):
        const thumb = this.getThumbUrls()
        const images = this.getLargeUrls()

        if (thumb) resImage.thumbnail = await this.postThumbnailScraping(thumb);
        if (images) resImage.images = await this.postImagesScraping(images);

        break;
      default: break;
    }

    return resImage;
  }

  async postThumbnailScraping(toPost) {
    try {
      const typeImage = 'thumbnail';
      const entity = this.getEntity();
      const dbItem = this.getDbItem();
      const item = this.getToPostItem();

      const resImage = await imageTools.getImageUrl(toPost, { imageFrom: entity, typeImage, id_: dbItem.id, name: item.title ? item.title : item.name })
      const { data: { url } } = resImage
      return url.url
    } catch (err) {
      throw err
    }
  }

  async postImagesScraping(toPost) {
    try {
      const typeImage = 'large';
      const entity = this.getEntity();
      const dbItem = this.getDbItem();
      const item = this.getToPostItem();

      const largeImages = [];
      let positionImage = 1
      for (const image of toPost) {
        const resImage = await imageTools.getImageUrl(image, { imageFrom: entity, typeImage, id_: dbItem.id, name: item.title ? item.title : item.name, positionImage })
        const { data: { url } } = resImage
        largeImages.push(url.url)
        positionImage += 1
      }
      return largeImages;
    } catch (err) {
      throw err
    }
  }
}