/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log, logDebug, logError } = require("./LogService");
const errors = require("./ErrorService");
const groupBy = require('group-by');
const { getError } = require("./ErrorService");

class PickingService {

  async getListaPedidos(userCode) {
    const res = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_SOLIC_PICKING_LISTA_PED", [userCode]);
    return res;
  }

  async getListaCancelaPicking(userCode) {
    const res = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_CANCELA_PICKINGS_LISTA", [userCode]);
    return res;
  }

  async cancelaPickings(data) {
    const { pickingDocEntries } = data;
    const query = `DELETE FROM SPS_WMS_PICKING WHERE "docEntry" = ?`;
    for (let i = 0; i < pickingDocEntries.length; i++) {
      await DirectDb.executeQuery(query, [pickingDocEntries[i]]);
    }
  }

  async criaPickings(data, username) {
    const { ordrData } = data;
    const ordrs = [];
    for (let i = 0; i < ordrData.length; i++) {
      const ordrDocEntry = ordrData[i].ordrDocEntry;
      let ordr = ordrs.find((o) => o.ordrDocEntry == ordrDocEntry);
      if (!ordr) {
        ordr = {
          ordrDocEntry,
          lines: []
        };
        ordrs.push(ordr);
      }
      ordr.lines.push(`${ordrData[i].rdr1LineNum}:${ordrData[i].pickQuantity}`);
    }
    for (let i = 0; i < ordrs.length; i++) {
      const docEntry = ordrs[i].ordrDocEntry;
      const linesStr = ordrs[i].lines.join(";");
      if (linesStr.length > 5000) {
        throw new Error(`Comprimento do parâmetro ${linesStr.length} excede limite da SP_SPS_WMS_PORTAL_SOLIC_PICKING_CRIA_PICKING. Informe essa mensagem ao suporte.`);
      }
      logDebug(`SP_SPS_WMS_PORTAL_SOLIC_PICKING_CRIA_PICKING(docEntry: ${docEntry}, linesStr: ${linesStr}), userCode: ${username}`);
      const ret = await DirectDb.executeProcedure("SP_SPS_WMS_PORTAL_SOLIC_PICKING_CRIA_PICKING", [docEntry, linesStr, username]);
      if (ret && ret.length > 0) {
        throw new Error(ret[0].Erro);
      }

      let queryDocEntryPicking = 'SELECT MAX("docEntry") "docEntry" FROM SPS_WMS_PICKING';
      let retDocEntryPicking = await DirectDb.executeQuery(queryDocEntryPicking);

      let queryBatchNumber = `SELECT 
                                "ordrLineNum" "BaseLineNumber",
                                "itemCode" "ItemCode",
                                "distNumber" "BatchNumber",
                                "distNumber" "InternalSerialNumber",
                                "quantity" "Quantity"
                              FROM 
                                SPS_WMS_PICKING_ITENS
                              WHERE
                                "docEntry" = ${retDocEntryPicking[0].docEntry}
                                AND "ordrLineNum" NOT IN (SELECT 
                                  DR1."LineNum"
                                FROM 
                                  RDR1 DR1
                                  JOIN ORDR ON DR1."DocEntry" = ORDR."DocEntry"
                                  JOIN OITM IT 
                                    ON IT."ItemCode" = DR1."ItemCode"
                                  JOIN OITL
                                    ON ORDR."ObjType" = OITL."DocType" AND ORDR."DocEntry" = OITL."DocEntry"  AND OITL."DocLine" = DR1."LineNum"
                                  JOIN ITL1
                                    ON OITL."LogEntry" = ITL1."LogEntry" 
                                  JOIN OBTN
                                    ON OBTN."AbsEntry" = ITL1."MdAbsEntry"
                                WHERE 
                                  DR1."DocEntry" = ${docEntry}
                                  AND DR1."LineStatus" = 'O'
                                  AND IT."ManBtchNum" = 'Y'
                                  AND (SELECT SUM(TL1."AllocQty") 
                                     FROM OITL ITL 
                                     INNER JOIN ITL1 TL1 ON ITL."LogEntry" = TL1."LogEntry" 
                                     WHERE ((ITL."DocType" = 17 AND ITL."DocEntry" = ${docEntry}) OR (ITL."DocType" = 13 AND ITL."BaseEntry" = ${docEntry})) AND TL1."MdAbsEntry" = ITL1."MdAbsEntry") > 0
                                 GROUP BY
                                   DR1."LineNum",
                                  DR1."ItemCode",
                                  DR1."WhsCode",
                                  OBTN."DistNumber")`;
      let retDocBatchNumber = await DirectDb.executeQuery(queryBatchNumber);
      let gruposLinhas = groupBy(retDocBatchNumber, "BaseLineNumber");
      
      let DocumentLines = [];
      for (let lineNum in gruposLinhas) {

        let linha = gruposLinhas[lineNum];
        
        let BatchNumbers = [];
        let BatchNumber = {};

        for (let j = 0; j < linha.length; j++) {

          for (const key of Object.keys(linha[j])) {
            BatchNumber[key] = linha[j][key];
          }

          BatchNumbers.push(JSON.parse(JSON.stringify(BatchNumber)));
        }

        let line = {
          LineNum: lineNum,
          BatchNumbers
        }

        DocumentLines.push(line);
      }

      let dadosServiceLayer = {
        DocumentLines
      }
      try {
        await ServiceLayer.execute({
          url: `Orders(${docEntry})`,
          method: "PATCH",
          data: dadosServiceLayer,
          timeout: 180000
        });
      } catch (error) {
        logError(getError(error));
      }

      await DirectDb.executeProcedure("SP_SPS_WMS_INSERT_NOTIFICATION", ['ALL', `Solicitado Picking do Pedido ${docEntry}`, 1]);
    }
  }

}

module.exports = new PickingService();