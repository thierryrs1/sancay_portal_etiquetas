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
      const { impressora, tipo, confVolumesLineKeys, visualizar, numVolume, jsonDataList } = req.body;
      const response = await printService.imprimeVolumes(impressora, tipo, confVolumesLineKeys, visualizar, numVolume, req.userInfo.username, jsonDataList);
      res.send(response);
    } catch (err) {
      sendError(res, err);
    }
  }


}

module.exports = new PrintController();
