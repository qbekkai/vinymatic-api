const AccessControl = require('accesscontrol')

const ac = new AccessControl();
ac.grant('baseRole')
  .readAny('all')
  .readOwn('user')
  .updateOwn('user')

/** ********* */
ac.grant('anonymous')
  .extend('baseRole')
  .createOwn('user:registration')

/** ********* */
ac.grant('basic')
  .extend('baseRole')

  .createOwn('all')
  .updateOwn('all')
  .deleteOwn('all')

  .readOwn('user:token')
  .updateOwn('user:token:refresh')
  .readOwn('user:preferences')

  .readOwn('like')
  .createOwn('like')
  .deleteOwn('like')

  .createOwn('collection:vinyl')
  .deleteOwn('collection:vinyl')

  .createOwn('playlist')
  .updateOwn('playlist')
  .deleteOwn('playlist')
  .createOwn('playlist:vinyl')
  .createOwn('playlist:audio')
  .updateOwn('playlist:audio:position')
  .deleteOwn('playlist:audio')

  .createOwn('sell')
  .updateOwn('sell')
  .deleteOwn('sell')

  .deleteOwn('user')
  .deleteOwn('user')
  .createOwn('user:follow')
  .deleteOwn('user:follow')

  .createOwn('vinyl')
  .updateOwn('vinyl')
  .deleteOwn('vinyl')
  .createOwn('vinyl:audio')

  .createOwn('wishlist:vinyl')
  .deleteOwn('wishlist:vinyl')

/** ********* */
ac.grant('admin')
  .extend('basic')

  .updateAny('scraping')

  .createAny('all')
  .updateAny('all')
  .deleteAny('all')

  .createAny('master')
  .updateAny('master')
  .deleteAny('master')

  .createAny('video')
  .updateAny('video')
  .deleteAny('video')

  .createAny('user')
  .updateAny('user')
  .deleteAny('user')

  .createAny('store')
  .updateAny('store')
  .deleteAny('store')

  .createAny('audio')
  .updateAny('audio')
  .deleteAny('audio')

const haveYouThePermission = (action, resource) => {
  return async (req, res, next) => {
    try {
      const permission = ac.can(req.user.role)[action](resource);
      if (!permission.granted)
        return res.status(403).json({ message: "You don't have enough permission to perform this action" });
      next()
    } catch (error) {
      next(error)
    }
  }
}
const isLogin = () => {
  return async (req, res, next) => {
    try {
      const authorizationHeader = req.headers.authorization
      if (authorizationHeader) return res.status(400).json({ message: "You are already connected." });
      next()
    } catch (error) {
      next(error)
    }
  }
}



module.exports = { ac, haveYouThePermission, isLogin };
