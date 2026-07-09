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
        let perms = JSON.parse(sessionStorage.getItem("perms") || "{}");
        try {
          perms = await this.serverService.get("/getPerms");
          sessionStorage.setItem("perms", JSON.stringify(perms));
        } catch(e) {}

        Object.keys(perms).forEach((k) => {
          this.setModelProperty("Data", k, perms[k]);
        });
      },
      onClickEtiquetaVolume: function() {
        this.navTo("etiquetavolume");
      },
      onClickPermissoes: function() {
        this.navTo("permissoes");
      },
      onClickConfiguraImpressao: function() {
        this.navTo("configuraimpressao");
      },
      onClickFilaImpressao: function() {
        this.navTo("filaimpressao");
      },
      onClickLogImpressao: function() {
        this.navTo("logimpressao");
      }

    })
);
