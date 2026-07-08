const { ServiceLayer , DirectDb } = require('sps-sap-interface');

module.exports = {
  async login(username, password) {
    try {
      await ServiceLayer.login({ username, password });
    } catch (err) {
      throw new Error('Falha ao autenticar usuário');
    }
  },
  async getCompanyName() {
    const res = await DirectDb.executeQuery(`SELECT TOP 1 "CompnyName" "cn" FROM OADM`);
    return res[0].cn;
  },
  async getPerms(login) {
    const res = await DirectDb.executeProcedure("SP_SPS_PERMISSOES", [ login ]);
    const perms = {};
    const all = res[0];
    const keys = Object.keys(all);
    for (let i = 0; i < keys.length; i++) {
      let key = keys[i];
      if (!key.startsWith("Portal")) {
        continue;
      }
      perms[key.replace(/^Portal\./, "")] = (all[key] == "Y");
    }
    return perms;
  }
};
