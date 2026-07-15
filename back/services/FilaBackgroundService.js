const { DirectDb } = require("sps-sap-interface");
const { logError, logDebug } = require("./LogService");
const printService = require("./PrintService");

class FilaBackgroundService {
  constructor() {
    this.interval = null;
    this.isProcessing = false;
  }

  start() {
    // Roda a cada 5 segundos
    this.interval = setInterval(() => this.processFila(), 5000);
    logDebug("FilaBackgroundService iniciado.");
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
  }

  async processFila() {
    if (this.isProcessing) return; // Evita sobreposição
    this.isProcessing = true;

    try {
      // 1. Limpeza de registros com mais de 1 hora
      try {
        await DirectDb.executeQuery(`DELETE FROM "SPS_FILA_IMPRESSAO" WHERE "Status" = 'Impresso' AND "DataProcessamento" < ADD_SECONDS(CURRENT_TIMESTAMP, -3600)`);
      } catch(e) {
        // Ignora erro de limpeza
      }

      // 2. Busca o mais antigo pendente
      const res = await DirectDb.executeQuery(`SELECT TOP 1 "IdFila", "TipoEtiqueta", "Impressora", "Chaves", "Copias", "Login" FROM "SPS_FILA_IMPRESSAO" WHERE "Status" = 'Pendente' ORDER BY "DataCriacao" ASC`);
      
      if (res && res.length > 0) {
        const fila = res[0];
        
        // 3. Marca como Processando
        await DirectDb.executeQuery(`UPDATE "SPS_FILA_IMPRESSAO" SET "Status" = 'Processando' WHERE "IdFila" = ?`, [fila.IdFila]);

        try {
          // 4. Imprime
          await printService.imprimeVolumes(fila.Impressora, fila.TipoEtiqueta, fila.Chaves, false, undefined, fila.Login, null, null, null, fila.Copias, 'Fila');
          
          // 5. Sucesso
          await DirectDb.executeQuery(`UPDATE "SPS_FILA_IMPRESSAO" SET "Status" = 'Impresso', "DataProcessamento" = CURRENT_TIMESTAMP WHERE "IdFila" = ?`, [fila.IdFila]);
        } catch (err) {
          // 6. Erro
          const errMsg = err.message ? err.message : String(err);
          await DirectDb.executeQuery(`UPDATE "SPS_FILA_IMPRESSAO" SET "Status" = 'Erro', "DataProcessamento" = CURRENT_TIMESTAMP, "MensagemErro" = ? WHERE "IdFila" = ?`, [errMsg, fila.IdFila]);
        }
      }

    } catch (err) {
      logError(`Erro no FilaBackgroundService: ${err.message}`);
    } finally {
      this.isProcessing = false;
    }
  }
}

module.exports = new FilaBackgroundService();
