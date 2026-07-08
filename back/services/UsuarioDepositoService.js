/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");

class UsuarioDepositoService {

  async getLogins() {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_LOGINS");
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo logins: ` + errors.getError(ex)
      );
    }
  }

  async getUsuarioDeposito(login) {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_USER_WHS", [ login ]);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo Usuário x Depósito: ` + errors.getError(ex)
      );
    }
  }

  async setUsuarioDeposito(list) {
    try {
      if (!list || list.length == 0) {
        return;
      }
      const login = list[0].login;
      let query = `DO BEGIN
        DELETE FROM SPS_WMS_USER_WHS WHERE "login" = '${login}';`;
      for (let i = 0; i < list.length; i++) {
        const ln = list[i];
        if (!ln.acesso) {
          continue;
        }
        query += `
        INSERT INTO SPS_WMS_USER_WHS
         ("login", "whsCode") VALUES ('${login}', '${ln.whsCode}' );
         `;
      }
      query += `
      END;`;
      await DirectDb.executeQuery(query);
    } catch (ex) {
      throw new Error(
        `Erro gravando usuário x depósito: ` + errors.getError(ex)
      );
    }
  }

  
}

module.exports = new UsuarioDepositoService();
