require('dotenv').config();
const { DirectDb } = require('./back/services/sps-sap-interface');
async function run() {
  try {
    await DirectDb.connect();
    const res = await DirectDb.executeQuery('SELECT "pathPrn" FROM SPS_TIPO_ETQ WHERE "tipoEtq" = ''etqCaixa''');
    console.log('PRN:', res[0].pathPrn);
    const spRes = await DirectDb.executeProcedure('SP_SPS_ETIQUETA_CAIXA', ['@40@@1@@PTB@']);
    console.log('KEYS:', Object.keys(spRes[0]));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
