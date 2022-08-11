module.exports = {
  logError: ({ err, req, res, next }) => {
    console.error(err);
    next(err);
  },
  unknowRouteHandle: ({ err, req, res, next }) => {
    res.status(404).json({ message: 'Impossible de trouver la ressource demandée ! Vous pouvez essayer une autre URL.' });
  },
}