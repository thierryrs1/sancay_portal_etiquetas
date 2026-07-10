/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");

class EtiquetaService {

  async getEstufas() {
    try {
      const res = await DirectDb.executeQuery(`SELECT DISTINCT "U_SPS_Estufa" as "APLATZ_ID" FROM "@SPS_PALLET_GROUP_L" WHERE "U_SPS_Estufa" IS NOT NULL ORDER BY TO_INT(SUBSTR_AFTER("APLATZ_ID", '_'))`);
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

  async getTiposEtiquetaVolume(username) {
    try {
      let res = await DirectDb.executeProcedure("SP_SPS_PORTAL_TIPOS_ETQ_VOLUME");
      try {
        const manuals = await DirectDb.executeQuery(`SELECT "tipoEtq" FROM SPS_TIPO_ETQ WHERE "isManual" = 'Y'`);
        const manualTipos = manuals.map(m => m.tipoEtq);
        res = res.filter(r => !manualTipos.includes(r.tipoEtq));
      } catch (e) {}

      if (username !== 'manager') {
        const perms = await DirectDb.executeQuery(`SELECT "etiqueta" FROM SPS_PERMISSOES_ETQ WHERE "login" = ? AND "acesso" = 'Y'`, [username]);
        const allowed = perms.map(p => p.etiqueta);
        res = res.filter(r => allowed.includes(r.tipoEtq));
      }
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo lista de tipos de etiqueta: ` + errors.getError(ex)
      );
    }
  }

  async getTiposEtiquetaManual(username) {
    try {
      let res = await DirectDb.executeQuery(`SELECT "tipoEtq", "icon", "isManual", "pathPrn", "procedure" FROM SPS_TIPO_ETQ WHERE "isManual" = 'Y'`);
      
      if (username !== 'manager') {
        const perms = await DirectDb.executeQuery(`SELECT "etiqueta" FROM SPS_PERMISSOES_ETQ WHERE "login" = ? AND "acesso" = 'Y'`, [username]);
        const allowed = perms.map(p => p.etiqueta);
        res = res.filter(r => allowed.includes(r.tipoEtq));
      }
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo lista de tipos de etiqueta manual: ` + errors.getError(ex)
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

  async getLogImpressao(dataIni, dataFin, login, tipoEtiqueta, impressora, chaves, isReimpressa, idEtiqueta) {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PORTAL_LOG_IMPRESSAO", [dataIni, dataFin, login || '', tipoEtiqueta || '', impressora || '', chaves || '', isReimpressa || '', idEtiqueta || '']);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo log de impressões: ` + errors.getError(ex)
      );
    }
  }

  async getFiltrosLogImpressao() {
    try {
      const logins = await DirectDb.executeQuery(`SELECT DISTINCT "Login" FROM "SPS_LOG_IMPRESSAO" WHERE "Login" IS NOT NULL AND "Login" != '' ORDER BY "Login"`);
      const tipos = await DirectDb.executeQuery(`SELECT DISTINCT "TipoEtiqueta" FROM "SPS_LOG_IMPRESSAO" WHERE "TipoEtiqueta" IS NOT NULL AND "TipoEtiqueta" != '' ORDER BY "TipoEtiqueta"`);
      const impressoras = await DirectDb.executeQuery(`SELECT DISTINCT "Impressora" FROM "SPS_LOG_IMPRESSAO" WHERE "Impressora" IS NOT NULL AND "Impressora" != '' ORDER BY "Impressora"`);
      const minMaxDates = await DirectDb.executeQuery(`SELECT TO_VARCHAR(MIN("DataHora"), 'YYYY-MM-DD') AS "MinDate", TO_VARCHAR(MAX("DataHora"), 'YYYY-MM-DD') AS "MaxDate" FROM "SPS_LOG_IMPRESSAO"`);

      return {
        logins: logins.map(x => x.Login),
        tipos: tipos.map(x => x.TipoEtiqueta),
        impressoras: impressoras.map(x => x.Impressora),
        minDate: minMaxDates && minMaxDates.length > 0 ? minMaxDates[0].MinDate : null,
        maxDate: minMaxDates && minMaxDates.length > 0 ? minMaxDates[0].MaxDate : null
      };
    } catch (ex) {
      throw new Error(`Erro obtendo filtros do log: ` + errors.getError(ex));
    }
  }

  async validaEtiqueta(tipoEtq) {
    try {
      const etqConf = await DirectDb.executeQuery(`SELECT 1 FROM SPS_TIPO_ETQ WHERE "tipoEtq" = ?`, [tipoEtq]);
      return etqConf && etqConf.length > 0;
    } catch (ex) {
      return false; // se der erro de banco, não trava, só diz que não achou (ou podemos relançar)
    }
  }

}

module.exports = new EtiquetaService();
