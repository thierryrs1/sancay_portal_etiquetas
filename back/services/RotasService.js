/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");

class RotasService {

  async getDepositos() {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_ROTAS_DEPOSITOS");
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo depósitos: ` + errors.getError(ex)
      );
    }
  }

  async getRotas() {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_ROTAS");
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo rotas: ` + errors.getError(ex)
      );
    }
  }

  async getRota(rotaDocEntry) {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_ROTA", [ rotaDocEntry ]);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo rota: ` + errors.getError(ex)
      );
    }
  }

  async removeRota(rotaDocEntry) {
    try {
      const query = `
      SELECT TOP 1 1 FROM OITM WHERE "U_SPS_WMS_CodigoDeRota" = ?`;
      const check = await DirectDb.executeQuery(query, [ rotaDocEntry ]);
      if (check.length > 0) {
        throw new Error(
          `Há itens cadastrados com essa rota`
        );  
      }
      await ServiceLayer.execute({
        url: `SPS_WMS_ROTAS(${rotaDocEntry})`,
        method: "DELETE"
      });
    } catch (ex) {
      throw new Error(
        `Erro removendo rota: ` + errors.getError(ex)
      );
    }
  }

  async adicionaRota(nomeNovaRota) {
    try {
      const query = `
      SELECT TOP 1 1 FROM "@SPS_WMS_ROTAS" WHERE "U_Rota" = ?`;
      const check = await DirectDb.executeQuery(query, [ nomeNovaRota ]);
      if (check.length > 0) {
        throw new Error(
          `Nome de rota já existe`
        );  
      }
      await ServiceLayer.execute({
        url: `SPS_WMS_ROTAS`,
        method: "POST",
        data: {
          U_Rota: nomeNovaRota
        }
      });
    } catch (ex) {
      throw new Error(
        `Erro adicionando rota: ` + errors.getError(ex)
      );
    }
  }

  async setRota(rotaDocEntry, list) {
    try {
      let query = `
      DO BEGIN
      DELETE FROM "@SPS_WMS_ROTASL" WHERE "DocEntry" = ${rotaDocEntry};`;
      for (let i = 0; i < list.length; i++) {
        if (!list[i].U_WhsCode_Origem) {
          continue;
        }
        query += `
        INSERT INTO "@SPS_WMS_ROTASL"
        (
          "DocEntry",
          "LineId",
          "VisOrder",
          "Object",
          "U_WhsCode_Origem",
          "U_WhsCode_Destino"
        ) VALUES (
          ${rotaDocEntry},
          ${i+1},
          ${i},
          'SPS_WMS_ROTAS',
          '${list[i].U_WhsCode_Origem}',
          '${list[i].U_WhsCode_Destino}'
        );
        `;
      }
      query += `
      END;`
      await DirectDb.executeQuery(query);
    } catch (ex) {
      throw new Error(
        `Erro gravando rota: ` + errors.getError(ex)
      );
    }
  }

    
}

module.exports = new RotasService();
