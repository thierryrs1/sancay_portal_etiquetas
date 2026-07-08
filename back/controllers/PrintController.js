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
      const { impressora, tipo ,confVolumesLineKeys, visualizar, numVolume } = req.body;
      let pdf = await printService.imprimeVolumes( impressora, tipo,confVolumesLineKeys, visualizar, numVolume );
      res.send(pdf);
    } catch (err) {
      sendError(res, err);
    }
  }

  async imprimeEtiquetasExpedicao(req, res) {
    try {
      const { printJob } = req.body;
      await printService.imprimeEtiquetasExpedicao( printJob );
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  }

  async imprimePaletes(req, res) {
    try {
      const { printJob } = req.body;
      await printService.imprimePaletes( printJob );
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  }

}

module.exports = new PrintController();
