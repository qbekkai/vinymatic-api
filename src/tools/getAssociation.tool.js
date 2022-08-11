module.exports = {
  getAsAssociation: (route, associationTo) => {
    const _route = route
    const _associationTo = associationTo
    let as = null

    switch (true) {
      case /vinyl/i.test(_associationTo):
        if (/^\/(?:collection|wishlist|format|genre|style)/.test(_route)) as = 'Vinyls';
        break;
      case /artist/i.test(_associationTo):
        if (/^\/(?:vinyl|collection|wishlist)/.test(_route)) as = 'VinylMainArtists';
        break;
      case /label/i.test(_associationTo):
        if (/^\/(?:collection|wishlist)/.test(_route)) as = 'VinylLabels';
        break;
      case /format/i.test(_associationTo):
        if (/^\/(?:collection|wishlist)/.test(_route)) as = 'Formats';
        break;
      default: break;
    }

    return as
  }
}