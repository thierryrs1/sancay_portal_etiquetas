/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel"],
  (BaseController, JSONModel) =>
    BaseController.extend("sps.wms.controller.home", {
      route: "home",
      async initialize() {
        this.setModel(new JSONModel(), "Data");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        await this.setPerms();
      },
      setPerms: async function() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        Object.keys(perms).forEach((k) => {
          this.setModelProperty("Data", k, perms[k]);
        });
      },
      onClickEtiquetaVolume: function() {
        this.navTo("etiquetavolume");
      },
      onClickEtiquetaPalete: function() {
        this.navTo("etiquetapalete");
      },
      onClickEtiquetaExpedicao: function() {
        this.navTo("etiquetaexpedicao");
      },
      onClickPermissoes: function() {
        this.navTo("permissoes");
      },
      onClickUsuarioDeposito: function() {
        this.navTo("usuariodeposito");
      },
      onClickRotas: function() {
        this.navTo("rotas");
      },
      onClickConfiguraImpressao: function() {
        this.navTo("configuraimpressao");
      },
      onClickConfiguracaoWms: function() {
        this.navTo("configuracaowms");
      }      ,
      onClickSolicitaPicking: function() {
        this.navTo("solicitapicking");
      },
      onClickCancelaPicking: function() {
        this.navTo("cancelapicking");
      }
      
    })
);
