/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  [
    "sps/wms/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sps/wms/base/ServerService",
  ],
  (BaseController, JSONModel, ServerService) =>
    BaseController.extend("sps.wms.controller.configsps", {
      route: "configsps",
      serverService: new ServerService(),
      async initialize() {
        this.getView().setBusy(true);
        try {
          this.setModel(new JSONModel(), "conf");
          this.loadConf()
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro carregando Configuração", err);
        } finally {
          this.getView().setBusy(false);
        }
      },
      onBack() {
        sessionStorage.setItem("token", "");
        this.navTo("login");
      },
      async loadConf() {
        this.getView().setBusy(true);
        try {
          const vbx = this.getView().byId("vbx");
          vbx.destroyItems();

          const confs = await this.serverService.get("/configSps/getWebConf");

          let lastSession = "";
          let panel;
          for (let i = 0; i < confs.length; i++) {
            const conf = confs[i];

            if (conf.session && conf.session != lastSession) {
              lastSession = conf.session;
              const sessionTitle = new sap.m.Title({
                text: conf.session
              });
              const panelHeaderToolbar = new sap.m.OverflowToolbar();
              panelHeaderToolbar.addContent(sessionTitle);
              panel = new sap.m.Panel(
                {
                  expandable: true,
                  headerToolbar: panelHeaderToolbar,
                }
              );
              vbx.addItem(panel);
            }
            const lblDescr = new sap.m.FormattedText({
              htmlText: conf.description
            });
            panel.addContent(lblDescr);
            const lblParm = new sap.m.Label({
              text: `${conf.parm} :`,
              textAlign: "Right",
              width: "15rem",
              tooltip: conf.parm
            });
            lblParm.addStyleClass("sapUiSmallMarginEnd");
            const inpVal = new sap.m.Input({
              value: { path: `conf>/${conf.parm}` },
              type: conf.pw ? sap.m.InputType.Password : sap.m.InputType.Text,
              width: "40rem"
            });
            this.setModelProperty("conf", conf.parm, conf.val);
            const hbx = new sap.m.HBox({
              alignItems: sap.m.FlexAlignItems.Center
            });
            hbx.addItem(lblParm);
            hbx.addItem(inpVal);
            hbx.addStyleClass("sapUiSmallMarginBottom");
            panel.addContent(hbx);
          }

          this.getModel("conf").refresh();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro carregando Configuração", err);
        } finally {
          this.getView().setBusy(false);
        }
      },
      onGravarClicked() {
        this.showQuestion(
          "Confirmar",
          "Confirma gravar configurações?\nO serviço será reiniciado.",
          this.gravarEnv.bind(this)
        );
      },
      async gravarEnv() {
        try {
          this.getView().setBusy(true);
          const conf = this.getModelData("conf");
          await this.serverService.post("/configSps/gravaEnv", conf);
          this.getView().setBusy(false);
          this.navTo("login");
        } catch (err) {
          this.getView().setBusy(false);
          this.showExceptionMessageBox("Erro", "Erro gravando Configuração", err);
        } 
      }
    })
);
