const ImageManagement = require('./ImageManagement.tool')



module.exports = async (files, item, options = {}) => {
  try {
    const { dbItem, imageFrom } = options
    const { idRelease, thumbnail, images } = item
    let im = null
    let allImages = {}

    if (files) {
      im = new ImageManagement(files, imageFrom)

      // const isValid = await im.validation().catch(err => { im.setError({ isError: true, name: 'VinymaticImagesNotValid', code: err }) })
      // const isError = im.getError()

      // if (isError && !isValid) {
      //   for (const err of isError.code.validator) {
      //     switch (true) {
      //       case /NOT_IMAGE_ERROR/.test(err.code):
      //         // if (!idRelease) await createdItem.update({ thumbnail: null, images: null })
      //         // else await createdItem.update({ thumbnail: '', images: [] })

      //         if (!idRelease) allImages[err.typeImage] = null
      //         else {
      //           switch (err.typeImage) {
      //             case 'thumbnail': allImages.thumbnail = ""; break;
      //             case 'images': allImages.images = []; break;
      //           }
      //         }
      //         break;
      //       case /NOT_EXIST_ERROR/.test(err.code):
      //         // await createdItem.update({ thumbnail: null, images: null })
      //         allImages[err.typeImage] = null
      //         break;
      //       default: throw isError;
      //     }
      //   }
      // } else {
      //   allImages = await im.postAllImages()
      // }
      // for (const [key, value] of Object.entries(files)) {

      // }

    } else {
      if (
        (!thumbnail && !images) ||
        (!thumbnail && images && typeof images === 'object' && images.length === 0) ||
        (thumbnail && typeof thumbnail === 'string' && thumbnail !== '' && !images) ||
        (thumbnail && typeof thumbnail === 'string' && thumbnail !== '' && images && typeof images === 'object' && images.length === 0)
      ) {
        allImages.thumbnail = '';
        allImages.images = [];
      } else {
        im = await new ImageManagement({
          thumbnail,
          images
        }, imageFrom, {
          isFromScraping: true,
          dbItem,
          toPostItem: item
        })



        const isValid = await im.validation().catch(err => { im.setError({ isError: true, name: 'VinymaticImagesNotValid', code: err }) })
        const isError = im.getError()
        if (isError && !isValid) {
          for (const err of isError.code.validator) {
            switch (true) {
              case /NOT_IMAGE_ERROR/.test(err.code):
                // if (!idRelease) await createdItem.update({ thumbnail: null, images: null })
                // else await createdItem.update({ thumbnail: '', images: [] })

                if (!idRelease) allImages[err.typeImage] = null
                else {
                  switch (err.typeImage) {
                    case 'thumbnail': allImages.thumbnail = ""; break;
                    case 'images': allImages.images = []; break;
                  }
                }
                break;
              case /NOT_EXIST_ERROR/.test(err.code):
                // await createdItem.update({ thumbnail: null, images: null })
                allImages[err.typeImage] = null
                break;
              default: throw isError;
            }
          }
        } else {
          allImages = await im.postAllImages()
        }
      }
    }

    return allImages
  } catch (err) {
    return err
  }
}