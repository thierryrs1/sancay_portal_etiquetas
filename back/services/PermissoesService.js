/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");

class PermissoesService {

  async getPermissoes() {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PERMISSOES", ['']);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo permissões: ` + errors.getError(ex)
      );
    }
  }

  async setPermissoes(list) {
    try {
      let query = `DO BEGIN`;
      const keys = Object.keys(list[0]);
      for (let i = 0; i < list.length; i++) {
        const fields = [];
        const values = [];
        for (let j = 0; j < keys.length; j++) {
          fields.push(`"${keys[j]}"`);
          if (keys[j] != "login") {
            values.push(`'${list[i][keys[j]] ? "Y" : "N"}'`);
          } else {
            values.push(`'${list[i][keys[j]]}'`);
          }
        }
        query += `
        UPSERT SPS_PERMISSOES (${fields.join(',')}) VALUES (${values.join(',')}) WITH PRIMARY KEY;`;
      }
      query += `
      END;`;
      await DirectDb.executeQuery(query);
    } catch (ex) {
      throw new Error(
        `Erro gravando permissões: ` + errors.getError(ex)
      );
    }
  }


}

module.exports = new PermissoesService();
