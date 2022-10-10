const { FormatInVinyl, DecriptionInFormatVinyl, FormatDescription, FormatSide, FormatSize, FormatSpeed, FormatVoice } = require('./../db/models')

module.exports = {
  addFormat: async (value, parentItem) => {
    const format = { name: value.name }
    const formatInVinyl = {
      nbFormat: value.nbFormat,
      text: value.text,
      FormatDescriptions: value.descriptions,
      FormatSides: value.sides,
      FormatSizes: value.sizes,
      FormatSpeeds: value.speeds,
      FormatVoices: value.voices,
    }

    const formatCreated = await parentItem.createFormat(format, {
      through: {
        nbFormat: formatInVinyl.nbFormat,
        text: formatInVinyl.text
      }
    })

    const vinylFormatFound = await FormatInVinyl.findOne({ where: { FormatId: formatCreated.id, VinylId: parentItem.id } })

    if (formatInVinyl.FormatDescriptions.length > 0) {
      for (const fd of formatInVinyl.FormatDescriptions) {
        // if (fdFound) fdFound.addFormatInVinyl([[vinylFormatFound.VinylId, vinylFormatFound.FormatId]])

        const fdFound = await FormatDescription.findOne({ where: { name: fd } })
        const fdCreated = await DecriptionInFormatVinyl.create({
          FormatDescriptionId: fdFound.id,
          FormatInVinylVinylId: vinylFormatFound.VinylId,
          FormatInVinylFormatId: vinylFormatFound.FormatId
        })

        await fdCreated.setFormatDescription(fdFound)
        await fdCreated.setFormatInVinyl(vinylFormatFound)
      }
    }
    if (formatInVinyl.FormatSides.length > 0) {
      for (const fsd of formatInVinyl.FormatSides) {
        const fsdFound = await FormatSide.findOne({ where: { name: fsd } })
        if (fsdFound) fsdFound.addFormatInVinyl(vinylFormatFound)
      }
    }
    if (formatInVinyl.FormatSizes.length > 0) {
      for (const fsz of formatInVinyl.FormatSizes) {
        const fszFound = await FormatSize.findOne({ where: { name: fsz } })
        if (fszFound) fszFound.addFormatInVinyl(vinylFormatFound)

      }
    }
    if (formatInVinyl.FormatSpeeds.length > 0) {
      for (const fsp of formatInVinyl.FormatSpeeds) {
        const fspFound = await FormatSpeed.findOne({ where: { name: fsp } })
        if (fspFound) fspFound.addFormatInVinyl(vinylFormatFound)

      }
    }
    if (formatInVinyl.FormatVoices.length > 0) {
      for (const fv of formatInVinyl.FormatVoices) {
        const fvFound = await FormatVoice.findOne({ where: { name: fv } })
        if (fvFound) fvFound.addFormatInVinyl(vinylFormatFound)

      }
    }
  }
}