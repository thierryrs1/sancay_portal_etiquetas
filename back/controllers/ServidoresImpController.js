const { DirectDb } = require("sps-sap-interface");
const { sendError } = require('../services/ErrorService');

class ServidoresImpController {
  
  async getServidores(req, res) {
    try {
      const result = await DirectDb.executeQuery(`SELECT "ip", "descricao" FROM "SPS_SERVIDORES_IMP"`);
      if (result) {
        const normalized = result.map(s => ({
          ip: s.ip || s.IP,
          descricao: s.descricao || s.DESCRICAO
        }));
        res.send(normalized);
      } else {
        res.send([]);
      }
    } catch (err) {
      // If table doesn't exist yet, just return empty to prevent breaking
      if (err.message && err.message.includes("invalid table name")) {
        res.send([]);
      } else {
        sendError(res, err);
      }
    }
  }

  async saveServidores(req, res) {
    try {
      const servidores = req.body;
      await DirectDb.executeQuery(`DELETE FROM "SPS_SERVIDORES_IMP"`);
      for (const s of servidores) {
        if (!s.ip) continue;
        const ipEscaped = String(s.ip).replace(/'/g, "''");
        const descEscaped = String(s.descricao || '').replace(/'/g, "''");
        await DirectDb.executeQuery(`INSERT INTO "SPS_SERVIDORES_IMP" ("ip", "descricao") VALUES ('${ipEscaped}', '${descEscaped}')`);
      }
      res.send("");
    } catch (err) {
      sendError(res, err);
    }
  }

}

module.exports = new ServidoresImpController();
