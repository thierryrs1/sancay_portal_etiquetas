const { DirectDb, ServiceLayer } = require("sps-sap-interface");

async function run() {
  const res = await DirectDb.executeQuery(`SELECT TOP 1 * FROM SPS_LOG_IMPRESSAO ORDER BY "DataHora" DESC`);
  console.log(JSON.stringify(res, null, 2));
}

run().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
