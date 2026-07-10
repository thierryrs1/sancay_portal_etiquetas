const express = require('express');
const loginController = require('./back/controllers/LoginController');
const authMiddleware = require('./back/middlewares/authMiddleware');
const path = require('path');
const routes = express.Router();
const printController = require("./back/controllers/PrintController");
const etiquetaController = require('./back/controllers/EtiquetaController');
const permissoesController = require('./back/controllers/PermissoesController');
const configuraImpressaoController = require("./back/controllers/ConfiguraImpressaoController");
const configSpsController = require("./back/controllers/ConfigSpsController");

routes.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/front/index.html`))
});

routes.get("/configSps/getConf/:confName", configSpsController.getConf);
routes.post("/configSps/checkConfigLogin", configSpsController.checkConfigLogin);
routes.get("/configSps/getWebConf", configSpsController.getWebConf);
routes.post("/configSps/gravaEnv", configSpsController.gravaEnv);


routes.post('/Login', loginController.login);
routes.get('/getCompanyName', authMiddleware, loginController.getCompanyName);
routes.get('/getPerms', authMiddleware, loginController.getPerms);

routes.use('/etiqueta', authMiddleware);

routes.get('/etiqueta/getTiposEtiquetaVolume', etiquetaController.getTiposEtiquetaVolume);
routes.get('/etiqueta/getTiposEtiquetaManual', etiquetaController.getTiposEtiquetaManual);
routes.get('/etiqueta/getFornecedoresVolume', etiquetaController.getFornecedoresVolume);																	  
routes.get('/etiqueta/getEstufas', etiquetaController.getEstufas);
routes.get('/etiqueta/getOrdensProducao', etiquetaController.getOrdensProducao);
routes.post('/etiqueta/getListaImpressoesVolume', etiquetaController.getListaImpressoesVolume);
routes.post('/etiqueta/getImpressorasVolume', etiquetaController.getImpressorasVolume);
routes.post('/etiqueta/getLogImpressao', etiquetaController.getLogImpressao);

routes.post("/etiqueta/imprimeEtq", printController.imprimeEtq);
routes.post("/etiqueta/imprimeVolumes", printController.imprimeVolumes);
routes.post("/etiqueta/imprimeManual", printController.imprimeManual);
routes.post('/printer/getQueues', printController.getQueues);
routes.post('/printer/clearQueue', printController.clearQueue);

routes.use('/permissoes', authMiddleware);
routes.get("/permissoes/getPermissoes", permissoesController.getPermissoes);
routes.post("/permissoes/setPermissoes", permissoesController.setPermissoes);

routes.use('/configuraImpressao', authMiddleware);
routes.get("/configuraImpressao/getImpressorasServidor", configuraImpressaoController.getImpressorasServidor);
routes.get("/configuraImpressao/getProcedures", configuraImpressaoController.getProcedures);
routes.get("/configuraImpressao/getTiposEtq", configuraImpressaoController.getTiposEtq);
routes.get("/configuraImpressao/getTipoImps", configuraImpressaoController.getTipoImps);
routes.post("/configuraImpressao/setConfigImpressao", configuraImpressaoController.setConfigImpressao);
routes.get("/configuraImpressao/getRegraFn", configuraImpressaoController.getRegraFn);
routes.post("/configuraImpressao/gravaRegraFn", configuraImpressaoController.gravaRegraFn);

module.exports = routes;
