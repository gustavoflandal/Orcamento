const winston = require('../config/winston');

module.exports = (err, req, res, next) => {
  winston.error(err.stack || err.message);
  res.status(err.status || 500).json({
    error: err.message || 'Erro interno do servidor.'
  });
};
