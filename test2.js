require('dotenv').config();
const { DirectDb } = require('sps-sap-interface');
async function run() {
  try {
    await DirectDb.connect();
    const spRes = await DirectDb.executeProcedure('SP_SPS_ETIQUETA_CAIXA', ['@40@@1@@PTB@']);
    console.log('KEYS:', Object.keys(spRes[0]));
    console.log('BARCODE KEY:', Object.keys(spRes[0]).find(k => k.toLowerCase() === 'barcode'));
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
run();
