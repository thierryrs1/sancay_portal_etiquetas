const { sendError } = require('../services/ErrorService');
const rotasService = require('../services/RotasService');

class RotasController {
  
  async getDepositos(req, res) {
    try {
      const ret = await rotasService.getDepositos();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async getRotas(req, res) {
    try {
      const ret = await rotasService.getRotas();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async getRota(req, res) {
    try {
      const { rotaDocEntry } = req.body;
      const ret = await rotasService.getRota(rotaDocEntry);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async removeRota(req, res) {
    try {
      const { rotaDocEntry } = req.body;
      const ret = await rotasService.removeRota(rotaDocEntry);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async adicionaRota(req, res) {
    try {
      const { nomeNovaRota } = req.body;
      const ret = await rotasService.adicionaRota(nomeNovaRota);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async setRota(req, res) {
    try {
      const { rotaDocEntry, list } = req.body;
      const ret = await rotasService.setRota(rotaDocEntry, list);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

}

module.exports = new RotasController();
