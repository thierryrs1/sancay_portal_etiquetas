const { sendError } = require('../services/ErrorService');
const etiquetaService = require('../services/EtiquetaService');

class EtiquetaController {
  
  async getListaImpressoesVolume(req, res) {
    try {
      const { filter } = req.body;
      filter.push(req.userInfo.username);
      const result = await etiquetaService.getListaImpressoesVolume(filter);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getListaPaletes(req, res) {
    try {
      const { filter } = req.body;
      filter.push(req.userInfo.username);
      const result = await etiquetaService.getListaPaletes(filter);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }
  
  async getListaEtiquetasExpedicao(req, res) {
    try {
      const { filter } = req.body;
      filter.push(req.userInfo.username);
      const result = await etiquetaService.getListaEtiquetasExpedicao(filter);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getTiposEtiquetaVolume(req, res) {
    try {
      const result = await etiquetaService.getTiposEtiquetaVolume();
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getImpressorasVolume(req, res) {
    try {
      const { tipoEtq } = req.params;
      const result = await etiquetaService.getImpressorasVolume(tipoEtq, req.userInfo.username);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getFornecedoresVolume(req, res) {
    try {
      const result = await etiquetaService.getFornecedoresVolume(req.userInfo.username);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getImpressorasPalete(req, res) {
    try {
      const result = await etiquetaService.getImpressorasPalete(req.userInfo.usercode);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getImpressorasExpedicao(req, res) {
    try {
      const result = await etiquetaService.getImpressorasExpedicao(req.userInfo.usercode);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

}

module.exports = new EtiquetaController();
