const fs = require("fs");
const errorService = require("./ErrorService");
const { log, logDebug, logError } = require("./LogService");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const iconv = require('iconv-lite');
const printer = require('@thiagoelg/node-printer');
const axios = require ('axios');
const path = require('path');
class PrintService {

  async imprimeVolumes(impressora, tipo, confVolumesLineKeys, visualizar, numVolume, username, jsonDataList) {
    logDebug(`start imprimeVolumes impressora=${impressora}, volumeIds=${confVolumesLineKeys}`);
    if ((confVolumesLineKeys === '' && tipo !== 'SALDO' ) || impressora === '') {
      return;
    }
    let pdf = await this.imprimeEtq(impressora, tipo, [ confVolumesLineKeys ], visualizar, numVolume);
    
    // Gravar Log apenas para impressões reais
    if (!visualizar) {
      try {
         const chavesStr = String(confVolumesLineKeys);
         const chavesArray = chavesStr.includes(',') ? chavesStr.split(',') : [chavesStr];
         const jsonArray = jsonDataList || [];
         const numVolumeEscaped = String(numVolume || '').replace(/'/g, "''");
         const usernameEscaped = String(username || '').replace(/'/g, "''");
         const impressoraEscaped = String(impressora).replace(/'/g, "''");
         const tipoEscaped = String(tipo).replace(/'/g, "''");
         
         const d = new Date();
         const pad = (n) => (n < 10 ? '0'+n : n);
         const exactTime = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
         
         for (let i = 0; i < chavesArray.length; i++) {
            const ch = chavesArray[i].trim().replace(/'/g, "''");
            const jsonStr = (jsonArray[i] ? JSON.stringify(jsonArray[i]) : '').replace(/'/g, "''");
            
            if (ch !== '') {
               const query = `INSERT INTO "SPS_LOG_IMPRESSAO" ("DataHora", "Login", "TipoEtiqueta", "Impressora", "Chaves", "JSON_Data") VALUES (TO_TIMESTAMP('${exactTime}', 'YYYY-MM-DD HH24:MI:SS'), '${usernameEscaped}', '${tipoEscaped}', '${impressoraEscaped}', '${ch}', '${jsonStr}')`;
               await DirectDb.executeQuery(query);
            }
         }
      } catch(logErr) {
         logError(`Erro gravando log de impressão: ` + logErr.message);
      }
    }

    logDebug("end imprimeVolumes");
    return pdf;
  }

  async imprimeManual(impressora, tipoEtiqueta, prnFinal, visualizar, username, jsonData) {
    let pdf = null;
    if (visualizar) {
      pdf = await this.visualizarEtiqueta(prnFinal);
    } else {
      let prnEncode = iconv.encode(prnFinal, "latin1");
      this.sendToPrinter(impressora, prnEncode);
      try {
         const jsonStr = (jsonData ? JSON.stringify(jsonData) : '').replace(/'/g, "''");
         const usernameEscaped = String(username || '').replace(/'/g, "''");
         const impressoraEscaped = String(impressora).replace(/'/g, "''");
         const tipoEscaped = String(tipoEtiqueta).replace(/'/g, "''");
         
         const d = new Date();
         const pad = (n) => (n < 10 ? '0'+n : n);
         const exactTime = `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
         
         const query = `INSERT INTO "SPS_LOG_IMPRESSAO" ("DataHora", "Login", "TipoEtiqueta", "Impressora", "Chaves", "JSON_Data") VALUES (TO_TIMESTAMP('${exactTime}', 'YYYY-MM-DD HH24:MI:SS'), '${usernameEscaped}', '${tipoEscaped}', '${impressoraEscaped}', 'Manual', '${jsonStr}')`;
         await DirectDb.executeQuery(query);
      } catch(logErr) {
         logError(`Erro gravando log de impressão manual: ` + logErr.message);
      }
    }
    return pdf;
  }


  async imprimeEtq(impressora, tipo, parms, visualizar, numVol) {
    if (!tipo || tipo == "") {
      const msg = "Tipo de impressão não informado";
      logError(`imprimeEtq: ${msg}`);
      throw new Error(msg);
    }
    if (!Array.isArray(parms)) {
      const msg = "Parâmetros incorretos: parms não é um array";
      logError(`imprimeEtq: ${msg}`);
      throw new Error(msg);
    }
    logDebug(`start imprimeEtq impressora=${impressora}, tipo=${tipo}, parms=[${parms.join(", ")}]`);
    // se impressora não informada, pega a primeira
    let query = `
      SELECT TOP 1
      TI."impressora",
      TE."pathPrn",
      TE."procedure"
      FROM
        SPS_TIPO_IMP TI
        JOIN SPS_TIPO_ETQ TE ON TE."tipoEtq" = TI."tipoEtq"
      WHERE
        TI."tipoEtq" = ?
        AND (TI."impressora" = ? OR ? = '')
      ORDER BY TI."default" DESC;
    `;
    logDebug("query printConf");
    const printConf = await DirectDb.executeQuery(query, [tipo, impressora, impressora]);
    
    if (!printConf || printConf.length == 0) {
      const msg = `Impressora ${impressora} não definida para tipo ${tipo}`;
      logError(`imprimeEtq: ${msg}`);
      throw new Error(msg);
    }
    const { pathPrn, procedure } = printConf[0];
    if (!pathPrn || pathPrn == "") {
      const msg = `Template de impressão não definido para tipo ${tipo}`;
      logError(`imprimeEtq: ${msg}`);
      throw new Error(msg);
    }
    if (!procedure || procedure == "") {
      const msg = `Procedure de impressão não definida para tipo ${tipo}`;
      logError(`imprimeEtq: ${msg}`);
      throw new Error(msg);
    }

    logDebug("query printConfKit");
    query = `
      SELECT TOP 1
      TE."pathPrn"
      FROM
      SPS_TIPO_ETQ TE
      WHERE
      TE."tipoEtq" = ?;
    `;
    let pathPrnKit;
    const printConfKit = await DirectDb.executeQuery(query, [`${tipo} KIT`]);
    if (printConfKit && printConfKit.length > 0) {
      pathPrnKit = printConfKit[0].pathPrn;
    }

    impressora = printConf[0].impressora;
    let template = pathPrn;
    let templateKit = pathPrnKit;
    let dadosEtq;
    let newProcedure = '';
    try {
      if (numVol != '' && numVol != undefined){
        newProcedure = procedure+'_VOL';
        parms.push(numVol);
      } else {
        newProcedure = procedure;
      }
      logDebug(`executando ${newProcedure}(${parms.join(", ")})`);
      dadosEtq = await DirectDb.executeProcedure(newProcedure, parms);
    } catch (err) {
      const msg = `Erro executando ${newProcedure}(${parms.join(", ")}): ${err.message}`;
      logError(`imprimeEtq: ${msg}`);
      throw new Error(msg);
    }
    if (!dadosEtq || dadosEtq.length == 0) {
      const msg = `${newProcedure}(${parms.join(", ")}) não retornou resultados`;
      logError(`imprimeEtq: ${msg}`);
      throw new Error(msg);
    }
    logDebug("substituindo campos e enviando à impressora");
    for (let i = 0; i < dadosEtq.length; i++) {
      const dados = dadosEtq[i];
      if ("U_SPS_Vol_Kit" in dados && +(dados.U_SPS_Vol_Kit) <= 1) {
        template = template.replace("@KITNN", "");
      } else {
        template = template.replace("@KITNN", `KIT 1/${dados.U_SPS_Vol_Kit}`);
      }
      let prn = this.populaPrn(template, dados);
      logDebug(prn);
      if (visualizar){
        let pdf = this.visualizarEtiqueta(prn);
        return pdf;
      }
      else {
        prn = iconv.encode(prn, "latin1");
        this.sendToPrinter(impressora, prn);
      }
      if ("U_SPS_Vol_Kit" in dados && +(dados.U_SPS_Vol_Kit) > 1) {
        for (let j = 2; j <= +dados.U_SPS_Vol_Kit; j++) {
          let prn = templateKit.replace("@KITNN", `KIT ${j}/${dados.U_SPS_Vol_Kit}`);
          prn = this.populaPrn(prn, dados);
          logDebug(prn);
          if (visualizar){
            let pdf = this.visualizarEtiqueta(prn);
            return pdf;
          }
          else {
            prn = iconv.encode(prn, "latin1");
            this.sendToPrinter(impressora, prn);
          }
        }
      }

    }
    logDebug("end imprimeEtq");
  }

  async visualizarEtiqueta(prn) {
    try {
      // ---- Limpeza de PDFs antigos (mais de 5 minutos) ----
      try {
        const dir = process.env.CAMINHO_PDF;
        if (fs.existsSync(dir)) {
          const files = fs.readdirSync(dir);
          const now = Date.now();
          files.forEach(file => {
            if (file.endsWith('.pdf')) {
              const filePath = path.join(dir, file);
              const stats = fs.statSync(filePath);
              const ageInMs = now - stats.mtimeMs;
              if (ageInMs > 5 * 60 * 1000) { // 5 minutos
                fs.unlinkSync(filePath);
              }
            }
          });
        }
      } catch (cleanupErr) {
        logError(`Erro na limpeza de PDFs: ${cleanupErr.message}`);
      }
      // -----------------------------------------------------

      let width = prn.match(/(\^PW)\d+/)[0].replace('^PW','');
      let height = prn.match(/(\^LL)\d+/)[0].replace('^LL','');

      width = width / 600;
      height = height / 600;

      const config = {
        encoding: null,
        responseType: 'arraybuffer',
        reponseEncoding: 'binary',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/pdf'
        }
      }

      const url = `http://api.labelary.com/v1/printers/24dpmm/labels/${width > 15 ? 15 : width}x${height > 15 ? 15 : height}/0/`;
      const uniqueId = Date.now() + "_" + Math.random().toString(36).substring(7);
      const filename = process.env.CAMINHO_PDF + uniqueId + "_" + process.env.NOME_PDF;
      let res = await axios.post(
        url,
        prn,
        config,
      ).then((response)=>{
          fs.writeFileSync(filename, response.data, 'binary');
      });

      return filename;
    } catch (ex) {
        const msg = `Erro obtendo pré-visualização Etiquetas Produção: ${ex.message}`;
        logError(`visualizaEtq: ${msg}`);
        throw new Error(msg);
    }
  }

  sendToPrinter(impressora, prn) {
    const me = this;
    printer.printDirect({
        data: prn,
        printer: impressora,
        type: "RAW",
        success: function () {
            logDebug(`enviado à impressora ${impressora}`);
        },
        error: function (err) {
            logError(err);
        }
    });
  }

  populaPrn(template, dados) {
    const keys = Object.keys(dados);
    keys.sort((a, b) => b.length - a.length); // replace campos com nome maior primeiro, evita substring
    let prn = template;
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.startsWith("1234567890")) { // para ean, não aceita conteúdo não numérico
        prn = this.replaceField(prn, `${key}`, `${dados[key]}`);
      } else {
        prn = this.replaceField(prn, `<${key}>`, `${dados[key]}`, `@${key}`);
      }
      
    }
    return prn;
  }

  formatNumber(n) {
    if (!/^[0-9,.]+$/.test(n)) {
      return n;
    }
    let a = `${+n}`; // garante que assume como string
    a = a.replace(/,/, ".");
    //a = a.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ","); // virgula a cada 3 digitos inteiros
    a = a.replace(/(?<=\.\d+?)0*$/, ""); // remove zeros à esquerda
    a = a.replace(/\.$/, ""); // remove ponto se não sobrou decimal
    return a;
  }

  replaceField(template, field, val, testField) {
    if (process.env.CAMPOS_NUMERICOS_ETIQUETA_REFORMATAR && process.env.CAMPOS_NUMERICOS_ETIQUETA_REFORMATAR != "") {
      const frex = new RegExp(`^(${process.env.CAMPOS_NUMERICOS_ETIQUETA_REFORMATAR})$`);
      if (frex.test(testField || field)) {
        val = this.formatNumber(val);
      }
    }
    const isEnclosed = field.startsWith("<") && field.endsWith(">");
    const suffix = isEnclosed ? "()" : "(\\W|$)";
    const rex = new RegExp(field + suffix, "gi");
    //@key, seguido de qualquer "coisa" não-word (que não seja a-zA-Z0-9_), todas ocorrencias (g)
    //isso evita que um campo @BLABLA seja substituido no @BLABLA1
    return template.replace(rex, `${val}$1`); // substitui pelo valor seguido da "coisa"
  }

  async getQueues() {
    return new Promise((resolve, reject) => {
      const exec = require('child_process').exec;
      exec('powershell -Command "Get-Printer | Select-Object Name, PrinterStatus, JobCount | ConvertTo-Json"', { maxBuffer: 1024 * 500 }, (error, stdout, stderr) => {
        if (error) {
          logError(`Erro getQueues: ${error.message}`);
          resolve([]);
          return;
        }
        try {
          const printers = JSON.parse(stdout);
          resolve(Array.isArray(printers) ? printers : [printers]);
        } catch(e) {
          resolve([]);
        }
      });
    });
  }

  async clearQueue(printerName) {
    return new Promise((resolve, reject) => {
      const exec = require('child_process').exec;
      const sanitized = String(printerName).replace(/"/g, '""');
      exec(`powershell -Command "Get-PrintJob -PrinterName \\"${sanitized}\\" | Remove-PrintJob"`, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve({ success: true });
      });
    });
  }

}

module.exports = new PrintService;
