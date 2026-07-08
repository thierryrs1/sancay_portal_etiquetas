/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel"],
  (BaseController, JSONModel) =>
    BaseController.extend("sps.wms.controller.configuracaowms", {
      route: "configuracaowms",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Configuracao_WMS) {
          this.navTo("home");
        }
        this.setModel(new JSONModel(), "Data");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        this.setModel(new JSONModel(), "conf");
        this.loadConf();
      },

      loadConf: async function () {
        sap.ui.core.BusyIndicator.show();
        
        try {
          const vbx = this.getView().byId("vbx");
          vbx.destroyItems();

          const sessionTitle = new sap.m.Title({
            text: "Parâmetros de Configuração"
          });
          const panelHeaderToolbar = new sap.m.OverflowToolbar();
          panelHeaderToolbar.addContent(sessionTitle);
          panel = new sap.m.Panel(
            {
              headerToolbar: panelHeaderToolbar,
            }
          );
          vbx.addItem(panel);

          const conf = await this.serverService.get("/configuracaoWms/getConfiguracao");
          const fields = Object.keys(conf).filter((f) => !f.endsWith("_descr"));
          for (let i = 0; i < fields.length; i++) {
            const field = fields[i];
            const value = conf[field];
            const descr = conf[`${field}_descr`];
            const lblDescr = new sap.m.FormattedText({
              htmlText: descr
            });
            panel.addContent(lblDescr);
            const lblParm = new sap.m.Label({
              text: `${field} :`,
              textAlign: "Right",
              width: "15rem",
              tooltip: field
            });
            lblParm.addStyleClass("sapUiSmallMarginEnd");
            const inpVal = new sap.m.Input({
              value: { path: `conf>/${field}` },
              width: "40rem"
            });
            this.setModelProperty("conf", field, value);
            const hbx = new sap.m.HBox({
              alignItems: sap.m.FlexAlignItems.Center
            });
            hbx.addItem(lblParm);
            hbx.addItem(inpVal);
            hbx.addStyleClass("sapUiSmallMarginBottom");
            panel.addContent(hbx);
          }
        } catch (ex) {
          this.showExceptionMessageBox(
            "Erro",
            "Erro buscando configurações",
            ex
          );
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      onGravarPressed: async function() {
        try {
          this.getView().setBusy(true);
          const conf = this.getModelData("conf");
          await this.serverService.post("/configuracaoWms/gravaConfiguracao", conf);
          this.getView().setBusy(false);
          this.showSuccessMessageBox("Gravada", "Configuração Gravada");
        } catch (err) {
          this.getView().setBusy(false);
          this.showExceptionMessageBox("Erro", "Erro gravando Configuração", err);
        } 
      },

    })
);
