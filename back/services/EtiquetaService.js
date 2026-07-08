/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");

class EtiquetaService {

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

  async getImpressorasPalete(userCode) {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PORTAL_IMPRESSORAS", ["PALETE", userCode]);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo impressoras etiqueta palete: ` + errors.getError(ex)
      );
    }
  }

  async getImpressorasExpedicao(userCode) {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PORTAL_IMPRESSORAS", ["EXPEDICAO", userCode]);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo impressoras etiqueta EXPEDICAO: ` + errors.getError(ex)
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

  async getListaPaletes(filter) {
    try {
      const lista = await DirectDb.executeProcedure(
        "SP_SPS_WMS_PORTAL_IMP_PALETES_LISTA",
        filter
      );
      return lista;
    } catch (ex) {
      throw new Error(
        `Erro obtendo lista de impressões: ` + errors.getError(ex)
      );
    }
  }

  async getListaEtiquetasExpedicao(filter) {
    try {
      const lista = await DirectDb.executeProcedure(
        "SP_SPS_WMS_PORTAL_IMP_EXPEDICAO_LISTA",
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
