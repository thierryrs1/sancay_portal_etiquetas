require('dotenv').config();
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

module.exports = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({
      error: 'Sessão inválida, faça novo login.'
    });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = await promisify(jwt.verify)(token, process.env.SESSION_KEY);
    req.userInfo = decoded;

    return next();
  } catch (err) {
    return res.status(401).json({
      status: 401,
      message: 'Sessão expirada, faça novo login.',
    });
  }
};
