const express = require('express');
const loginController = require('./back/controllers/LoginController');
const authMiddleware = require('./back/middlewares/authMiddleware');
const path = require('path');
const routes = express.Router();
const printController = require("./back/controllers/PrintController");
const etiquetaController = require('./back/controllers/EtiquetaController');
const permissoesController = require('./back/controllers/PermissoesController');
const usuarioDepositoController = require('./back/controllers/UsuarioDepositoController');
const rotasController = require("./back/controllers/RotasController");
const configuraImpressaoController = require("./back/controllers/ConfiguraImpressaoController");
const configSpsController = require("./back/controllers/ConfigSpsController");
const configuracaoWmsController = require("./back/controllers/ConfiguracaoWmsController");
const pickingController = require("./back/controllers/PickingController");

routes.get('/', (req, res) => {
  res.sendFile(path.join(`${__dirname}/front/index.html`))
});

routes.get("/configSps/getConf/:confName", configSpsController.getConf);
routes.post("/configSps/checkConfigLogin", configSpsController.checkConfigLogin);
routes.get("/configSps/getWebConf", configSpsController.getWebConf);
routes.post("/configSps/gravaEnv", configSpsController.gravaEnv);

routes.use("/configuracaoWms/", authMiddleware);
routes.get("/configuracaoWms/getConfiguracao", configuracaoWmsController.getConfiguracao);
routes.post("/configuracaoWms/gravaConfiguracao", configuracaoWmsController.gravaConfiguracao);


routes.post('/Login', loginController.login);
routes.get('/getCompanyName', authMiddleware, loginController.getCompanyName);
routes.get('/getPerms', authMiddleware, loginController.getPerms);

routes.use('/etiqueta', authMiddleware);

routes.get('/etiqueta/getTiposEtiquetaVolume', etiquetaController.getTiposEtiquetaVolume);
routes.get('/etiqueta/getFornecedoresVolume', etiquetaController.getFornecedoresVolume);																	  
routes.get('/etiqueta/getEstufas', etiquetaController.getEstufas);
routes.get('/etiqueta/getOrdensProducao', etiquetaController.getOrdensProducao);
routes.post('/etiqueta/getListaImpressoesVolume', etiquetaController.getListaImpressoesVolume);
routes.post('/etiqueta/getListaPaletes', etiquetaController.getListaPaletes);
routes.post('/etiqueta/getListaEtiquetasExpedicao', etiquetaController.getListaEtiquetasExpedicao);

routes.post('/etiqueta/getImpressorasVolume', etiquetaController.getImpressorasVolume);
routes.post('/etiqueta/getImpressorasPalete', etiquetaController.getImpressorasPalete);
routes.post('/etiqueta/getImpressorasExpedicao', etiquetaController.getImpressorasExpedicao);																							 


routes.post("/etiqueta/imprimeEtq", printController.imprimeEtq);
routes.post("/etiqueta/imprimePaletes", printController.imprimePaletes);
routes.post("/etiqueta/imprimeVolumes", printController.imprimeVolumes);
routes.post("/etiqueta/imprimeEtiquetasExpedicao", printController.imprimeEtiquetasExpedicao);

routes.use('/permissoes', authMiddleware);
routes.get("/permissoes/getPermissoes", permissoesController.getPermissoes);
routes.post("/permissoes/setPermissoes", permissoesController.setPermissoes);

routes.use('/usuarioDeposito', authMiddleware);
routes.get("/usuarioDeposito/getLogins", usuarioDepositoController.getLogins);
routes.post("/usuarioDeposito/getUsuarioDeposito", usuarioDepositoController.getUsuarioDeposito);
routes.post("/usuarioDeposito/setUsuarioDeposito", usuarioDepositoController.setUsuarioDeposito);

routes.use('/rotas', authMiddleware);
routes.get("/rotas/getDepositos", rotasController.getDepositos);
routes.get("/rotas/getRotas", rotasController.getRotas);
routes.post("/rotas/getRota", rotasController.getRota);
routes.post("/rotas/setRota", rotasController.setRota);
routes.post("/rotas/removeRota", rotasController.removeRota);
routes.post("/rotas/adicionaRota", rotasController.adicionaRota);

routes.use('/configuraImpressao', authMiddleware);
routes.get("/configuraImpressao/getImpressorasServidor", configuraImpressaoController.getImpressorasServidor);
routes.get("/configuraImpressao/getProcedures", configuraImpressaoController.getProcedures);
routes.get("/configuraImpressao/getTiposEtq", configuraImpressaoController.getTiposEtq);
routes.get("/configuraImpressao/getTipoImps", configuraImpressaoController.getTipoImps);
routes.post("/configuraImpressao/setConfigImpressao", configuraImpressaoController.setConfigImpressao);
routes.get("/configuraImpressao/getRegraFn", configuraImpressaoController.getRegraFn);
routes.post("/configuraImpressao/gravaRegraFn", configuraImpressaoController.gravaRegraFn);	

routes.use('/picking', authMiddleware);
routes.get("/picking/getListaPedidos", pickingController.getListaPedidos);
routes.get("/picking/getListaCancelaPicking", pickingController.getListaCancelaPicking);
routes.post("/picking/criaPickings", pickingController.criaPickings);
routes.post("/picking/cancelaPickings", pickingController.cancelaPickings);

module.exports = routes;
