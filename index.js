/* eslint-disable import/no-unresolved */
require('dotenv').config({ path: require('path').resolve(__dirname, '.env') })
require('regenerator-runtime');
const { ServiceLayer, DirectDb } = require('sps-sap-interface');
const cookieParser = require('cookie-parser')
const server = require('./server');
const express = require('express');
const fs = require("fs");
const https = require("https");
const port = process.env.PORT;
const { log } = require('./back/services/LogService');
const errors = require('./back/services/ErrorService');
const conf = require("./back/services/ConfigSpsService");

server.use(cookieParser());
server.use(express.static(__dirname))

const privateKey  = fs.readFileSync(process.env.CAMINHO_KEY , 'utf8');
const certificate = fs.readFileSync(process.env.CAMINHO_CRT , 'utf8'); 

const credentials = {key: privateKey, cert: certificate};
const httpsServer = https.createServer(credentials, server);
  
httpsServer.listen(port, async () => {
  log(`Serviço Iniciado: porta ${process.env.PORT}; DB ${process.env.DB_SERVER} : ${process.env.DB_NAME}`);
  try {
    log(`Conectando DB`);
    await DirectDb.init({
      server: process.env.DB_SERVER,
      database: process.env.DB_NAME,
      username: conf.decrypt(process.env.DB_USERNAME),
      password: conf.decrypt(process.env.DB_PASSWORD),
      databaseType: process.env.DB_TYPE
    });
    await DirectDb.executeQuery(`SELECT TOP 1 "ItemCode" FROM {db}.OITM`);
    log(`DB Conectado`);

    try {
      await DirectDb.executeQuery(`ALTER TABLE SPS_TIPO_ETQ ADD ("controlaVolume" VARCHAR(1) DEFAULT 'N')`);
      log(`Coluna controlaVolume criada com sucesso!`);
    } catch(e) {
      // Ignora erro se a coluna já existir
    }

    const FilaBackgroundService = require('./back/services/FilaBackgroundService');
    FilaBackgroundService.start();

    log(`Conectando ServiceLayer`);
    await ServiceLayer.init({
      database: process.env.DB_NAME,
      username: conf.decrypt(process.env.SERVICE_LAYER_USERNAME),
      password: conf.decrypt(process.env.SERVICE_LAYER_PASSWORD),
      url: process.env.SERVICE_LAYER_URL
    });
    log(`ServiceLayer Conectada`);

  } catch (err) {
    log(errors.getError(err));
  }
});



