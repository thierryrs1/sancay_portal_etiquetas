const { sendError } = require('../services/ErrorService');
const permissoesService = require('../services/PermissoesService');

class PermissoesController {
  
  async getPermissoes(req, res) {
    try {
      const ret = await permissoesService.getPermissoes();
      res.send(ret);
    } catch (err) {
      sendError(res, err);
    }
  } 

  async setPermissoes(req, res) {
    try {
      const { list } = req.body;
      await permissoesService.setPermissoes(list);
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  } 

}

module.exports = new PermissoesController();
