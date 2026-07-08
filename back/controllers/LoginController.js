/* eslint-disable no-nested-ternary */
/* eslint-disable func-names */

require('dotenv').config();
const jwt = require('jsonwebtoken');

const loginService = require('../services/LoginService');
const { sendError } = require('../services/ErrorService');

class LoginController {
  async login(req, res) {
    try {
      const { username, password } = req.body;

      await loginService.login(username, password);

      const loginInfo = {
        database: process.env.DB_NAME,
        username,
      };

      const token = jwt.sign(loginInfo, process.env.SESSION_KEY, {
        expiresIn: '10h',
      });

      res.json({ token, username });
    } catch (err) {
      sendError(res, err);
    }
  }

  async getCompanyName(req, res) {
    try {
      const cn = await loginService.getCompanyName();
      res.send(cn);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getPerms(req, res) {
    try {
      const perms = await loginService.getPerms(req.userInfo.username);
      res.send(perms);
    } catch (err) {
      sendError(res, err);
    }
  }
}

module.exports = new LoginController();
