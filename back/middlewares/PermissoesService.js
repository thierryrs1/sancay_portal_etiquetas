/* eslint-disable consistent-return */
const fs = require("fs");
const { ServiceLayer, DirectDb } = require("sps-sap-interface");
const { log } = require("./LogService");
const errors = require("./ErrorService");

class PermissoesService {

  async getPermissoes() {
    try {
      const res = await DirectDb.executeProcedure("SP_SPS_PERMISSOES", ['']);
      
      // Busca todas as etiquetas cadastradas
      const tipos = await DirectDb.executeProcedure("SP_SPS_PORTAL_TIPOS_ETQ_VOLUME");
      
      // Busca as permissões da tabela nova
      const etqPerms = await DirectDb.executeQuery('SELECT "login", "etiqueta", "acesso" FROM "SPS_PERMISSOES_ETQ"');
      
      for (let user of res) {
        // Inicializa todas as etiquetas com 'N' para o usuário
        for (let tipo of tipos) {
           user[`Etiqueta.${tipo.tipoEtq}`] = 'N';
        }
        // Preenche com 'Y' onde encontrar
        for (let p of etqPerms) {
           if (p.login === user.login) {
               user[`Etiqueta.${p.etiqueta}`] = p.acesso;
           }
        }
      }
      return res;
    } catch (ex) {
      throw new Error(
        `Erro obtendo permissões: ` + errors.getError(ex)
      );
    }
  }

  async setPermissoes(list) {
    try {
      let query = `DO BEGIN `;
      const keys = Object.keys(list[0]);
      
      const portalKeys = keys.filter(k => k === 'login' || k.startsWith('Portal.'));
      const etqKeys = keys.filter(k => k.startsWith('Etiqueta.'));

      for (let i = 0; i < list.length; i++) {
        // 1. Salva permissões do Portal (SPS_PERMISSOES)
        const fields = [];
        const values = [];
        for (let j = 0; j < portalKeys.length; j++) {
          fields.push(`"${portalKeys[j]}"`);
          if (portalKeys[j] != "login") {
            values.push(`'${(list[i][portalKeys[j]] ? "Y" : "N").replace(/'/g, "''")}'`);
          } else {
            const loginEscaped = String(list[i][portalKeys[j]]).replace(/'/g, "''");
            values.push(`'${loginEscaped}'`);
          }
        }
        query += `
        UPSERT SPS_PERMISSOES (${fields.join(',')}) VALUES (${values.join(',')}) WITH PRIMARY KEY;`;
        
        // 2. Salva permissões de Etiqueta (SPS_PERMISSOES_ETQ)
        const login = String(list[i].login).replace(/'/g, "''");
        for (let j = 0; j < etqKeys.length; j++) {
          const key = etqKeys[j];
          const etiqueta = String(key.replace('Etiqueta.', '')).replace(/'/g, "''");
          const acesso = list[i][key] ? "Y" : "N";
          query += `
          UPSERT SPS_PERMISSOES_ETQ ("login", "etiqueta", "acesso") VALUES ('${login}', '${etiqueta}', '${acesso}') WITH PRIMARY KEY;`;
        }
      }
      query += `
      END;`;
      await DirectDb.executeQuery(query);
    } catch (ex) {
      throw new Error(
        `Erro gravando permissões: ` + errors.getError(ex)
      );
    }
  }


}

module.exports = new PermissoesService();
