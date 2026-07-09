const { sendError } = require('../services/ErrorService');
const etiquetaService = require('../services/EtiquetaService');

class EtiquetaController {
  
  async getEstufas(req, res) {
    try {
      const result = await etiquetaService.getEstufas();
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getOrdensProducao(req, res) {
    try {
      const result = await etiquetaService.getOrdensProducao();
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }
  
  async getListaImpressoesVolume(req, res) {
    try {
      const { filter } = req.body;
      const result = await etiquetaService.getListaImpressoesVolume(filter);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }


  async getTiposEtiquetaVolume(req, res) {
    try {
      const result = await etiquetaService.getTiposEtiquetaVolume(req.userInfo.username);
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



}

module.exports = new EtiquetaController();
