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
        this.setModel(new JSONModel({ lista: [] }), "Notificacoes");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        await this.setPerms();
        this.buscaNotificacoes();
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
      onClickEtiquetaVolume() {
        this.getRouter().navTo("etiquetavolume");
      },

      onClickEtiquetaManual() {
        this.getRouter().navTo("etiquetamanual");
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
      },
      
      async buscaNotificacoes() {
        try {
          const res = await this.serverService.get("/etiqueta/getNotificacoesErro");
          this.setModelProperty("Notificacoes", "lista", res || []);
        } catch (e) { }
      },

      async onNotificacoesPress(oEvent) {
        const oButton = oEvent.getSource();
        if (!this._pPopover) {
          this._pPopover = sap.ui.core.Fragment.load({
            id: this.getView().getId(),
            name: "sps.wms.view.notificacoes",
            controller: this
          }).then((oPopover) => {
            this.getView().addDependent(oPopover);
            return oPopover;
          });
        }
        this._pPopover.then((oPopover) => {
          oPopover.openBy(oButton);
        });
      },

      async onLimparNotificacoes() {
        try {
          await this.serverService.post("/etiqueta/deleteNotificacoesErro");
          this.setModelProperty("Notificacoes", "lista", []);
          if (this._pPopover) {
            this._pPopover.then(p => p.close());
          }
        } catch (e) {
          this.showErrorMessageBox("Erro", e.message);
        }
      }

    })
);
