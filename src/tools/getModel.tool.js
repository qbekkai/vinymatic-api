const models = require('./../db/models')

module.exports = {
  getModelByRoute: (route) => {
    const _route = route
    let model = null

    switch (true) {
      case /^\/vinyl/.test(_route): model = models.Vinyl; break;
      case /^\/master/.test(_route): model = models.Master; break;
      case /^\/label/.test(_route): model = models.Label; break;
      case /^\/artist/.test(_route): model = models.Artist; break;
      case /^\/collection/.test(_route): model = models.Collection; break;
      case /^\/wishlist/.test(_route): model = models.Wishlist; break;
      case /^\/audio/.test(_route): model = models.Audio; break;
      case /^\/playlist/.test(_route): model = models.Playlist; break;
      case /^\/format/.test(_route): model = models.Format; break;
      case /^\/genre/.test(_route): model = models.Genre; break;
      case /^\/style/.test(_route): model = models.Style; break;
      default: break;
    }

    return model
  },
  getModelByAssociation: (association) => {
    const _association = association
    let model = null

    switch (true) {
      case /^vinyl$/i.test(_association): model = models.Vinyl; break;
      case /^master$/i.test(_association): model = models.Master; break;
      case /^label$/i.test(_association): model = models.Label; break;
      case /^artist$/i.test(_association): model = models.Artist; break;
      case /^collection$/i.test(_association): model = models.Collection; break;
      case /^wishlist$/i.test(_association): model = models.Wishlist; break;
      case /^audio$/i.test(_association): model = models.Audio; break;
      case /^playlist$/i.test(_association): model = models.Playlist; break;
      case /^format$/i.test(_association): model = models.Format; break;
      case /^genre$/i.test(_association): model = models.Genre; break;
      case /^style$/i.test(_association): model = models.Style; break;
      default: break;
    }

    return model
  }
}