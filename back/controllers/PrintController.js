const { sendError } = require('../services/ErrorService');
const printService = require('../services/PrintService');

class PrintController {
  
  async imprimeEtq(req, res) {
    try {
      const { impressora, tipo, parms } = req.body;
      await printService.imprimeEtq( impressora, tipo, parms );
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  } 

  async imprimeVolumes(req, res) {
    try {
      const { impressora, tipo, confVolumesLineKeys, visualizar, numVolume, jsonDataList, logIdOrigem, motivoReimpressao } = req.body;
      const response = await printService.imprimeVolumes(impressora, tipo, confVolumesLineKeys, visualizar, numVolume, req.userInfo.username, jsonDataList, logIdOrigem, motivoReimpressao);
      res.send(response);
    } catch (err) {
      sendError(res, err);
    }
  }

  async getQueues(req, res) {
    try {
      const result = await printService.getQueues();
      res.send(result);
    } catch(err) {
      sendError(res, err);
    }
  }

  async clearQueue(req, res) {
    try {
      const result = await printService.clearQueue(req.body.printerName);
      res.send(result);
    } catch(err) {
      sendError(res, err);
    }
  }

  async restartSpooler(req, res) {
    try {
      const result = await printService.restartSpooler();
      res.send(result);
    } catch(err) {
      sendError(res, err);
    }
  }

  async imprimeManual(req, res) {
    try {
      const { impressora, tipoEtiqueta, prnFinal, visualizar, jsonData } = req.body;
      const response = await printService.imprimeManual(impressora, tipoEtiqueta, prnFinal, visualizar, req.userInfo.username, jsonData);
      res.send(response);
    } catch (err) {
      sendError(res, err);
    }
  }

}

module.exports = new PrintController();
