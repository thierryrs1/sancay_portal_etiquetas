/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");

class EtiquetaService {

  async getEstufas() {
    try {
      const res = await DirectDb.executeQuery(`SELECT "APLATZ_ID" FROM "BEAS_APLATZ" WHERE "APLATZ_ID" LIKE 'ESTUFA_%' ORDER BY TO_INT(SUBSTR_AFTER("APLATZ_ID", '_'))`);
      return res;
    } catch (ex) {
      throw new Error(`Erro obtendo lista de estufas: ` + errors.getError(ex));
    }
  }

  async getOrdensProducao() {
    try {
      const res = await DirectDb.executeQuery(`SELECT DISTINCT "U_SPS_BELNR_ID" || '/' || "U_SPS_BELPOS_ID" AS "Documento" FROM "@SPS_PALLET_GROUP_L" WHERE "U_SPS_BELNR_ID" IS NOT NULL AND "U_SPS_BELPOS_ID" IS NOT NULL ORDER BY TO_INT(SUBSTR_BEFORE("Documento", '/')) DESC, TO_INT(SUBSTR_AFTER("Documento", '/')) LIMIT 5000`);
      return res;
    } catch (ex) {
      throw new Error(`Erro obtendo lista de OP: ` + errors.getError(ex));
    }
  }

  async getTiposEtiquetaVolume() {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PORTAL_TIPOS_ETQ_VOLUME");
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo lista de tipos de etiqueta: ` + errors.getError(ex)
      );
    }
  }

  async getFornecedoresVolume(userCode) {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PORTAL_ETIQUETA_FORNEC", [userCode]);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo lista de fornecedores nos volumes: ` + errors.getError(ex)
      );
    }
  }

  async getImpressorasVolume(tipoEtq, userCode) {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PORTAL_IMPRESSORAS", [tipoEtq || "", userCode]);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo lista de impressoras: ` + errors.getError(ex)
      );
    }
  }


  async getListaImpressoesVolume(filter) {
    try {
      const lista = await DirectDb.executeProcedure(
        "SP_SPS_PORTAL_IMP_VOL_LISTA",
        filter
      );
      return lista;
    } catch (ex) {
      throw new Error(
        `Erro obtendo lista de impressões: ` + errors.getError(ex)
      );
    }
  }

}

module.exports = new EtiquetaService();
