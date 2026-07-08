const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");


class ConfiguracaoWmsService {
  async getConfiguracao() {
    const response = await DirectDb.executeQuery("SELECT * FROM SPS_WMS_CONFIG");
    if (response.length != 1) {
      throw new Error(`Tabela SPS_WMS_CONFIG tem ${response.length} linhas, deveria ter 1`);
    }
    return response[0];
  }

  async gravaConfiguracao(conf) {
    const fields = Object.keys(conf).filter((f) => !f.endsWith("_descr"));
    const values = [];
    const placeholders = [];
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const value = conf[field];
      values.push(value);
      placeholders.push(`"${field}" = ?`);
    }
    const query = `UPDATE SPS_WMS_CONFIG SET ${placeholders.join(", ")}`;
    DirectDb.executeQuery(query, values);
  }
}

module.exports = new ConfiguracaoWmsService();
