sap.ui.define([
  "sps/wms/controller/BaseController",
  "sap/ui/model/json/JSONModel"
], function(BaseController, JSONModel) {
  "use strict";

  return BaseController.extend("sps.wms.controller.servidoresimp", {

    onInit: function() {
      this.getRouter().getRoute("servidoresimp").attachMatched(this._onRouteMatched, this);
    },

    _onRouteMatched: function() {
      this.carregaDados();
    },

    async carregaDados() {
      sap.ui.core.BusyIndicator.show();
      try {
        const list = await this.serverService.get("/servidores/getServidores");
        this.setModel(new JSONModel({ list }), "Data");
      } catch (err) {
        this.showExceptionMessageBox("Erro", "Erro ao carregar servidores", err);
      }
      sap.ui.core.BusyIndicator.hide();
    },

    onAdd: function() {
      const list = this.getModel("Data").getProperty("/list");
      list.push({ ip: "", descricao: "" });
      this.getModel("Data").refresh();
    },

    onDelete: function(oEvent) {
      const path = oEvent.getSource().getBindingContext("Data").getPath();
      const idx = parseInt(path.split("/")[2]);
      const list = this.getModel("Data").getProperty("/list");
      list.splice(idx, 1);
      this.getModel("Data").refresh();
    },

    async onSave() {
      const list = this.getModel("Data").getProperty("/list");
      sap.ui.core.BusyIndicator.show();
      try {
        await this.serverService.post("/servidores/saveServidores", list);
        this.showSuccessMessageBox("Sucesso", "Servidores salvos com sucesso.");
        this.carregaDados();
      } catch (err) {
        this.showExceptionMessageBox("Erro", "Erro ao salvar", err);
      }
      sap.ui.core.BusyIndicator.hide();
    }

  });
});
