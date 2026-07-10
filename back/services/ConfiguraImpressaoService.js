/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");
const printer = require('@thiagoelg/node-printer');

class ConfiguraImpressaoService {

  async getImpressorasServidor() {
    try {
      const res = printer.getPrinters();
      const usedPrinters = await DirectDb.executeQuery(`SELECT DISTINCT "impressora" FROM SPS_TIPO_IMP`);
      for (let i = 0; i < usedPrinters.length; i++) {
        if (usedPrinters[i].impressora && !(res.find((p) => p.name == usedPrinters[i].impressora))) {
          res.push({ name: usedPrinters[i].impressora });
        }
      }
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo impressoras: ` + errors.getError(ex)
      );
    }
  }

  async getProcedures() {
    try {
      const query = `
        SELECT PROCEDURE_NAME "procedure"
        FROM "PUBLIC"."PROCEDURES" 
        WHERE SCHEMA_NAME= ? 
        AND PROCEDURE_NAME LIKE 'SP_SPS_ETIQUETA_%'
        ORDER BY PROCEDURE_NAME;
      `;
      const res = await DirectDb.executeQuery(query, [process.env.DB_NAME]);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo procedures: ` + errors.getError(ex)
      );
    }
  }

  async getTiposEtq() {
    try {
      const query = `
        SELECT 
        "tipoEtq",
        "icon",
        "isManual",
        "pathPrn",
        "procedure"
        FROM SPS_TIPO_ETQ
        ORDER BY "tipoEtq";
      `;
      const res = await DirectDb.executeQuery(query);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo tipos etiqueta: ` + errors.getError(ex)
      );
    }
  }

  async getTipoImps() {
    try {
      const query = `
        SELECT 
        "tipoEtq",
        "impressora",
        "default"
        FROM SPS_TIPO_IMP
        ORDER BY "default" DESC, "impressora";
      `;
      const res = await DirectDb.executeQuery(query);
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo tipo x impressoras: ` + errors.getError(ex)
      );
    }
  }

  async setConfigImpressao(tiposEtq, tipoImps) {
    try {
      const tipos = [];
      let query = `
      DO BEGIN
      DELETE FROM SPS_TIPO_ETQ;
      DELETE FROM SPS_TIPO_IMP;
      `;
      for (let i = 0; i < tiposEtq.length; i++) {
        const t = tiposEtq[i];
        if (!t.tipoEtq) {
          continue;
        }
        const tipoEtq = t.tipoEtq.replace(/'/g, "''");
        tipos.push(tipoEtq);
        const pathPrn = t.pathPrn.replace(/'/g, "''");
        const icon = t.icon ? t.icon.replace(/'/g, "''") : "";
        const isManual = t.isManual === "Y" || t.isManual === true ? "Y" : "N";
        query += `
        INSERT INTO SPS_TIPO_ETQ ("tipoEtq", "pathPrn", "procedure", "icon", "isManual")
        VALUES ('${tipoEtq}', '${pathPrn}', '${t.procedure}', '${icon}', '${isManual}');
        `;
      }
      for (let i = 0; i < tipoImps.length; i++) {
        const t = tipoImps[i];
        if (!t.tipoEtq || !tipos.includes(t.tipoEtq)) {
          continue;
        }
        const tipoEtq = t.tipoEtq.replace(/'/g, "''");
        const impressora = t.impressora.replace(/'/g, "''");
        query += `
        INSERT INTO SPS_TIPO_IMP ("tipoEtq", "impressora", "default")
        VALUES ('${tipoEtq}', '${impressora}', '${t.default}');
        `;
      }
      query += `
      END;`;
      await DirectDb.executeQuery(query);
    } catch (ex) {
      throw new Error(
        `Erro gravando configuração: ` + errors.getError(ex)
      );
    }
  }

  async getRegraFn() {
    let query;
    if (process.env.DB_TYPE == "HANA") {
      query = `
      SELECT DEFINITION FN 
      FROM PUBLIC.FUNCTIONS 
      WHERE SCHEMA_NAME = ? 
      AND FUNCTION_NAME = 'FN_SPS_WMS_ETIQ_REGRA';`;
    } else {
      query = `
      SELECT OBJECT_DEFINITION(OBJECT_ID('FN_SPS_WMS_ETIQ_REGRA', 'FUNCTION')) FN;`;
    }
    const res = await DirectDb.executeQuery(query, [process.env.DB_NAME]);
    if (!res || res.length == 0) {
      throw new Error(
        `Erro ao obter definição da function FN_SPS_WMS_ETIQ_REGRA`
      )
    }
    const sp = res[0].FN;
    const spLines = sp.split(/\r?\n/);
    const headerLines = [];
    const casesLines = [];
    const joinsLines = [];
    let section = "header";
    for (let i = 0; i < spLines.length; i++) {
      const line = spLines[i];
      if (section == "header") {
        headerLines.push(line);
        if (/^CASE (:?@|:)oper/.test(line)) {
          section = "cases";
        }
        continue;
      }
      if (section == "cases") {
        casesLines.push(line);
        if (/^FROM/.test(spLines[i + 2])) {
          section = "joins";
        }
        continue;
      }
      if (section == "joins") {
        joinsLines.push(line);
      }
    }
    const header = headerLines.join("\r\n");
    const cases = casesLines.join("\r\n");
    const joins = joinsLines.join("\r\n");
    return {
      header,
      cases,
      joins
    };
  }

  async gravaRegraFn(data) {
    let { header, cases, joins } = data;
    if (/\b(DROP|INSERT|DELETE|ALTER|CREATE|UPDATE)\b/.test(cases)) {
      throw new Error("DROP|INSERT|DELETE|ALTER|CREATE|UPDATE não permitido");
    }
    header = header.replace("CREATE ", "ALTER ");
    header = header + "\r\n";
    cases = cases + "\r\n";
    joins = joins + "\r\n";
    let sp = header + cases + joins;
    sp = sp.replace("\r\n", "\n");
    sp = sp.replace("\n", "\r\n");
    await DirectDb.executeQuery(sp);
  }

}

module.exports = new ConfiguraImpressaoService();
