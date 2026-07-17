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

  async getTiposEtiquetaManual(req, res) {
    try {
      const result = await etiquetaService.getTiposEtiquetaManual(req.userInfo.username);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getImpressorasVolume(req, res) {
    try {
      const { tipoEtq } = req.body;
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

  async getLogImpressao(req, res) {
    try {
      const { dataIni, dataFin, login, tipoEtiqueta, impressora, chaves, isReimpressa, idEtiqueta } = req.body;
      const result = await etiquetaService.getLogImpressao(dataIni, dataFin, login, tipoEtiqueta, impressora, chaves, isReimpressa, idEtiqueta);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getFiltrosLogImpressao(req, res) {
    try {
      const result = await etiquetaService.getFiltrosLogImpressao();
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async validaEtiqueta(req, res) {
    try {
      const { tipo } = req.body;
      const exists = await etiquetaService.validaEtiqueta(tipo);
      res.send({ exists });
    } catch (err) {
      sendError(res, err);
    }
  }

  async executaProcedureManual(req, res) {
    try {
      const { procedure, parametro } = req.body;
      const result = await etiquetaService.executaProcedureManual(procedure, parametro);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async executaQueryDinamica(req, res) {
    try {
      const { query } = req.body;
      const result = await etiquetaService.executaQueryDinamica(query);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getNotificacoesErro(req, res) {
    try {
      const login = req.userInfo.username;
      const result = await etiquetaService.getNotificacoesErro(login);
      res.send(result);
    } catch (err) {
      sendError(res, err);
    }
  }

  async deleteNotificacoesErro(req, res) {
    try {
      const login = req.userInfo.username;
      await etiquetaService.deleteNotificacoesErro(login);
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  }

  async deleteNotificacaoErroById(req, res) {
    try {
      const login = req.userInfo.username;
      const { idFila } = req.body;
      await etiquetaService.deleteNotificacaoErroById(login, idFila);
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  }

}

module.exports = new EtiquetaController();
