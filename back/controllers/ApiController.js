const { sendError } = require('../services/ErrorService');
const { DirectDb } = require("sps-sap-interface");

class ApiController {
  
  async apiImprimir(req, res) {
    try {
      // Validação do Token
      const token = req.headers['x-api-key'];
      const envToken = process.env.API_TOKEN;

      if (!envToken || token !== envToken) {
        return res.status(401).json({ error: 'Não Autorizado. Token inválido ou não configurado.' });
      }

      const { tipoEtiqueta, Parametro, copias, userCode, Impressora } = req.body;

      if (!tipoEtiqueta || !Parametro || !userCode) {
         return res.status(400).json({ error: 'Parâmetros obrigatórios ausentes. Envie: tipoEtiqueta, Parametro, userCode' });
      }

      // Validar se o tipo de etiqueta existe e se não é manual
      const tipoEtqRes = await DirectDb.executeQuery(
        `SELECT "isManual", "controlaVolume" FROM "SPS_TIPO_ETQ" WHERE "tipoEtq" = ?`,
        [tipoEtiqueta]
      );

      if (!tipoEtqRes || tipoEtqRes.length === 0) {
        return res.status(400).json({ error: `O tipo de etiqueta '${tipoEtiqueta}' não foi encontrado no sistema.` });
      }

      if (tipoEtqRes[0].isManual === 'Y') {
        return res.status(400).json({ error: `O tipo de etiqueta '${tipoEtiqueta}' é uma etiqueta manual e não pode ser gerada via API.` });
      }

      const numCopias = copias ? parseInt(copias, 10) : 1;

      if (tipoEtqRes[0].controlaVolume === 'Y' && numCopias > 1) {
        return res.status(400).json({ error: `A etiqueta tipo ${tipoEtiqueta} não permite imprimir mais de 1 cópia.` });
      }

      let impressora = Impressora;

      if (impressora) {
        // Validar se a impressora informada está vinculada ao tipo de etiqueta
        const checkImp = await DirectDb.executeQuery(
          `SELECT "impressora" FROM "SPS_TIPO_IMP" WHERE "tipoEtq" = ? AND "impressora" = ?`,
          [tipoEtiqueta, impressora]
        );
        if (!checkImp || checkImp.length === 0) {
          return res.status(400).json({ error: `A impressora '${impressora}' não está vinculada ao tipo de etiqueta '${tipoEtiqueta}'.` });
        }
      } else {
        // Buscar Impressora Padrão
        const impressoraRes = await DirectDb.executeQuery(
          `SELECT "impressora" FROM "SPS_TIPO_IMP" WHERE "tipoEtq" = ? AND "default" = 'Y'`, 
          [tipoEtiqueta]
        );

        if (!impressoraRes || impressoraRes.length === 0) {
          return res.status(400).json({ error: `A impressora padrão não está cadastrada para o tipo de etiqueta '${tipoEtiqueta}'.` });
        }

        impressora = impressoraRes[0].impressora;
      }
      const imprimirNaHora = req.body.imediato === true || req.body.imediato === 'true';

      if (imprimirNaHora) {
        const printService = require('../services/PrintService');
        await printService.imprimeVolumes(impressora, tipoEtiqueta, Parametro, false, undefined, userCode, null, null, null, numCopias, 'API');
        return res.status(200).json({ status: "sucesso", mensagem: "Etiqueta processada e enviada diretamente para a impressora." });
      } else {
        // Inserir direto na fila para o Worker background processar
        await DirectDb.executeQuery(
          `INSERT INTO "SPS_FILA_IMPRESSAO" ("Status", "TipoEtiqueta", "Impressora", "Chaves", "Copias", "Login", "DataCriacao") VALUES ('Pendente', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
          [tipoEtiqueta, impressora, Parametro, numCopias, userCode]
        );
        return res.status(200).json({ status: "sucesso", mensagem: "Etiqueta enviada para a fila de impressão." });
      }

    } catch (err) {
      sendError(res, err);
    }
  }

}

module.exports = new ApiController();
