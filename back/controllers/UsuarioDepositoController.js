const { sendError } = require('../services/ErrorService');
const usuarioDepositoService = require('../services/UsuarioDepositoService');

class UsuarioDepositoController {
  
  async getLogins(req, res) {
    try {
      const ret = await usuarioDepositoService.getLogins();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async getUsuarioDeposito(req, res) {
    try {
      const { login } = req.body;
      const ret = await usuarioDepositoService.getUsuarioDeposito(login);
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async setUsuarioDeposito(req, res) {
    try {
      const { list } = req.body;
      await usuarioDepositoService.setUsuarioDeposito(list);
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  } 

}

module.exports = new UsuarioDepositoController();
