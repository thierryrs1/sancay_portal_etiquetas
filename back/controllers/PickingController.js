const { sendError } = require('../services/ErrorService');
const pickingService = require('../services/PickingService');

class PickingController {
  
  async getListaPedidos(req, res) {
    try {
      const ret = await pickingService.getListaPedidos(req.userInfo.username);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async getListaCancelaPicking(req, res) {
    try {
      const ret = await pickingService.getListaCancelaPicking(req.userInfo.username);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async criaPickings(req, res) {
    try {
      const ret = await pickingService.criaPickings(req.body, req.userInfo.username);
      res.sendStatus(201);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async cancelaPickings(req, res) {
    try {
      const ret = await pickingService.cancelaPickings(req.body);
      res.sendStatus(204);
    } catch (err) {
      sendError(res, err);
    }
  } 



}

module.exports = new PickingController();
