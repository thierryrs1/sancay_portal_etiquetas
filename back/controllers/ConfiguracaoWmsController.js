const { sendError } = require('../services/ErrorService');
const configuracaoWmsService = require('../services/ConfiguracaoWmsService');

class ConfiguracaoWmsController {
  async getConfiguracao(req, res) {
    try {
      const response = await configuracaoWmsService.getConfiguracao();
      res.send(response);
    } catch (err) {
      sendError(res, err);
    }
  }
  async gravaConfiguracao(req, res) {
    try {
      await configuracaoWmsService.gravaConfiguracao(req.body);
      res.sendStatus(204);
    } catch (err) {
      sendError(res, err);
    }
  }
}

module.exports = new ConfiguracaoWmsController();
