const { sendError } = require('../services/ErrorService');
const configSpsService = require('../services/ConfigSpsService');

class ConfigSpsController {
  async getConf(req, res) {
    try {
      const { confName } = req.params;
      const response = await configSpsService.getConf(confName);
      res.send(response);
    } catch (err) {
      sendError(res, err);
    }
  }
  async checkConfigLogin(req, res) {
    try {
      const response = await configSpsService.checkConfigLogin(req.body);
      res.send(response);
    } catch (err) {
      sendError(res, err);
    }
  }
  async getWebConf(req, res) {
    try {
      const response = await configSpsService.getWebConf();
      res.send(response);
    } catch (err) {
      sendError(res, err);
    }
  }
  async gravaEnv(req, res) {
    try {
      const response = await configSpsService.gravaEnv(req.body);
      res.sendStatus(200);
    } catch (err) {
      sendError(res, err);
    }
  }
}

module.exports = new ConfigSpsController();
