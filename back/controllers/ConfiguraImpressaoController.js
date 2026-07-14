const { sendError } = require('../services/ErrorService');
const configuraImpressaoService = require('../services/ConfiguraImpressaoService');

class ConfiguraImpressaoController {
  
  async getImpressorasServidor(req, res) {
    try {
      const ret = await configuraImpressaoService.getImpressorasServidor();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async getProcedures(req, res) {
    try {
      const ret = await configuraImpressaoService.getProcedures();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getTiposEtq(req, res) {
    try {
      const ret = await configuraImpressaoService.getTiposEtq();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getTipoImps(req, res) {
    try {
      const ret = await configuraImpressaoService.getTipoImps();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  }

  async setConfigImpressao(req, res) {
    try {
      const { tiposEtq, tipoImps } = req.body;
      await configuraImpressaoService.setConfigImpressao(tiposEtq, tipoImps);
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  } 
  
  async getRegraFn(req, res) {
    try {
      const ret = await configuraImpressaoService.getRegraFn();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  }

  async gravaRegraFn(req, res) {
    try {
      await configuraImpressaoService.gravaRegraFn(req.body);
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  }

  async getTags(req, res) {
    try {
      const { tipoEtq } = req.body;
      const ret = await configuraImpressaoService.getTags(tipoEtq);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  }

  async saveTags(req, res) {
    try {
      const { tipoEtq, tags } = req.body;
      await configuraImpressaoService.saveTags(tipoEtq, tags);
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  }

}

module.exports = new ConfiguraImpressaoController();
