/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/Fragment"],
  (BaseController, JSONModel, Fragment) =>
    BaseController.extend("sps.wms.controller.rotas", {
      route: "rotas",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Rotas) {
          this.navTo("home");
        }
        this.setModel(new JSONModel(), "Data");
        this.setModel(new JSONModel(), "Depositos");
        this.setModel(new JSONModel(), "Rotas");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        this.carregaDepositos();
        this.carregaRotas();
      },

      async carregaDepositos() {
        try {
          const list = await this.serverService.get("/rotas/getDepositos");
          list.splice(0, 0, { WhsCode: "" });
          this.setModelProperty("Depositos", "list", list);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getDepositos", err);
        }
      },
      async carregaRotas() {
        try {
          const list = await this.serverService.get("/rotas/getRotas");
          list.splice(0, 0, { DocEntry: "", Descr: "" });
          this.setModelProperty("Rotas", "list", list);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getRotas", err);
        }
      },

      async carregaRota() {

        const rotaDocEntry = this.getModelProperty("Data", "rotaDocEntry");
        if (!rotaDocEntry) {
          this.setModelProperty("Data", "list", []);
          return;
        }
        sap.ui.core.BusyIndicator.show();
        try {
          const list = await this.serverService.post("/rotas/getRota", { rotaDocEntry });
          list.push({ U_WhsCode_Origem: null })
          this.getModel("Data").setSizeLimit(list.length);

          this.setModelProperty("Data", "list", list);

        } catch (ex) {
          this.showExceptionMessageBox(
            "Erro",
            "Erro buscando rota",
            ex
          );
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      addLine() {
        const data = this.getModelData("Data");
        const list = data.list;
        const idx = list.length - 1;
        list[idx].U_WhsCode_Origem = "";
        list.push({ U_WhsCode_Origem: null });
        this.getModel("Data").refresh();
      },

      deleteLine(ev) {
        const btn = ev.getSource();
        const bind = btn.getParent().getBindingContext("Data");
        const path = bind.getPath();
        const idx = path.replace("/list/", "");
        const list = this.getModelProperty("Data", "list");
        list.splice(idx, 1);
        this.getModel("Data").refresh();
      },

      removeRota() {
        this.showQuestion("Confirma", "Confirma remover a rota?",
          this.doRemoveRota.bind(this));
      },

      async adicionaRota() {
        if (!this.nomeRotaDialog) {
          this.nomeRotaDialog = await Fragment.load({
            id: this.getView().getId(),
            name: "sps.wms.view.nomerota",
            controller: this
          });
          
          this.getView().addDependent(this.nomeRotaDialog);
        }
        this.nomeRotaDialog.open();
      },

      async onConfirmNomeRotaClick() {
        this.nomeRotaDialog.close();
        const nomeNovaRota = this.getModelProperty("Data", "nomeNovaRota");
        if (!nomeNovaRota) {
          return;
        }
        sap.ui.core.BusyIndicator.show();
        try {
          await this.serverService.post("/rotas/adicionaRota", { nomeNovaRota });
          this.showSuccessMessageBox("Adicionada", "Rota adicionada");
          this.setModelProperty("Data", "list", []);
          this.carregaRotas();
        } catch (ex) {
          this.showExceptionMessageBox(
            "Erro",
            "adicionaRota",
            ex
          );
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }

      },

      onCancelaNomeRotaClick() {
        this.nomeRotaDialog.close();
      },

      async doRemoveRota() {
        const rotaDocEntry = this.getModelProperty("Data", "rotaDocEntry");
        if (rotaDocEntry == 1) {
          this.showErrorMessageBox("Erro", "Rota padrão não pode ser removida");
          return;
        }
        try {
          sap.ui.core.BusyIndicator.show();
          await this.serverService.post("/rotas/removeRota", { rotaDocEntry });
          this.showSuccessMessageBox("Removida", "Rota removida");
          this.setModelProperty("Data", "list", []);

          this.carregaRotas();

        } catch (err) {
          this.showExceptionMessageBox("Erro", "removeRota", err);
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      onSavePressed: async function () {
        const list = this.getModelProperty("Data", "list");
        const rotaDocEntry = this.getModelProperty("Data", "rotaDocEntry");
        try {
          sap.ui.core.BusyIndicator.show();
          await this.serverService.post("/rotas/setRota", { rotaDocEntry, list });
          this.showSuccessMessageBox("Gravados", "Rota gravada");
          this.carregaRota();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao gravar rota", err);
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

    })
);
