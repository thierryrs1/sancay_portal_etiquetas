/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/ui/core/Fragment"],
  (BaseController, JSONModel, Fragment) =>
    BaseController.extend("sps.wms.controller.configuraimpressao", {
      route: "configuraimpressao",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Configura_Impressao) {
          this.navTo("home");
        }
        this.setModel(new JSONModel(), "Data");
        this.setModel(new JSONModel(), "Impressoras");
        this.setModel(new JSONModel(), "TipoEtq");
        this.setModel(new JSONModel(), "TipoImp");
        this.setModel(new JSONModel(), "Procedures");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));

        this.carregaDados();
        
      },

      onOpenPrnModal: function (oEvent) {
        const oSource = oEvent.getSource();
        const oContext = oSource.getBindingContext("TipoEtq");
        
        if (!this._oPrnDialog) {
          this._oPrnDialog = this.getView().byId("prnDialog");
        }
        this._oPrnDialog.setBindingContext(oContext, "TipoEtq");
        this._oPrnDialog.open();
      },

      onClosePrnModal: function () {
        if (this._oPrnDialog) {
          this._oPrnDialog.close();
        }
      },

      carregaDados() {
        this.carregaImpressoras();
        this.carregaProcedures();
        this.buscaTipoImps();
        this.carregaTiposEtq();
      },

      async carregaImpressoras() {
        try {
          const list = await this.serverService.get("/configuraImpressao/getImpressorasServidor");
          list.splice(0, 0, { DocEntry: "", Descr: "" });
          this.getModel("Impressoras").setSizeLimit(list.length);
          this.setModelProperty("Impressoras", "list", list);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getImpressorasServidor", err);
        }
      },

      async carregaProcedures() {
        try {
          const list = await this.serverService.get("/configuraImpressao/getProcedures");
          list.splice(0, 0, { DocEntry: "", Descr: "" });
          this.getModel("Procedures").setSizeLimit(list.length);
          this.setModelProperty("Procedures", "list", list);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getProcedures", err);
        }
      },

      async carregaTiposEtq() {
        try {
          const list = await this.serverService.get("/configuraImpressao/getTiposEtq");
          list.push({ tipoEtq: null });
          this.getModel("TipoEtq").setSizeLimit(list.length);
          this.setModelProperty("TipoEtq", "list", list);
          this.tipoEtq = "";
          this.carregaTipoImps();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getTiposEtq", err);
        }
      },

      async tipoEtqSelected() {
        const tblTipoEtq = this.getView().byId("tblTipoEtq");
        const selectedIndices = tblTipoEtq.getSelectedIndices();
        if (!selectedIndices || selectedIndices.length == 0) {
          this.carregaTipoImps("");
          return;
        }

        const path = tblTipoEtq.getContextByIndex(selectedIndices[0]).getPath();
        const model = this.getModel("TipoEtq");
        const item = model.getProperty(path);
        this.carregaTipoImps(item.tipoEtq);

      },

      async buscaTipoImps() {
        const list = await this.serverService.get("/configuraImpressao/getTipoImps");
        list.forEach((it) => it.defaultChk = (it.default == 'Y'));
        list.push({ tipoEtq: null });
        this.getModel("Data").setSizeLimit(list.length);
        this.setModelProperty("Data", "tipoImps", list);
      },

      carregaTipoImps(tipoEtqSelecionado) {
        if (!tipoEtqSelecionado) {
          this.tipoEtqSelecionado = "";
          this.setModelProperty("TipoImp", "list", []);  
        } else {
          this.tipoEtqSelecionado = tipoEtqSelecionado;
          const list = this.getModelProperty("Data", "tipoImps");
          const filtList = list.filter((it) => it.tipoEtq === null || it.tipoEtq == tipoEtqSelecionado)
          this.getModel("TipoImp").setSizeLimit(filtList.length);
          this.setModelProperty("TipoImp", "list", filtList);
        }
        this.getModel("TipoImp").refresh();
      },

      deleteTipoEtq(ev) {
        const btn = ev.getSource();
        const bind = btn.getParent().getBindingContext("TipoEtq");
        const path = bind.getPath();
        const idx = path.replace("/list/", "");
        const list = this.getModelProperty("TipoEtq", "list");
        if (this.tipoEtqSelecionado && this.tipoEtqSelecionado == list[idx].tipoEtq) {
          this.tipoEtqSelecionado = "";
          this.carregaTipoImps("");
          const tblTipoEtq = this.getView().byId("tblTipoEtq");
          tblTipoEtq.clearSelection();
        }        
        list.splice(idx, 1);
        this.getModel("TipoEtq").refresh();
      },

      addTipoEtq() {
        const list = this.getModelProperty("TipoEtq", "list");
        list[list.length - 1].tipoEtq = "";
        list.push({ tipoEtq: null });
        this.getModel("TipoEtq").refresh();
      },

      deleteTipoImp(ev) {
        const btn = ev.getSource();
        const bind = btn.getParent().getBindingContext("TipoImp");
        const path = bind.getPath();
        const idx = path.replace("/list/", "");
        const list = this.getModelProperty("TipoImp", "list");
        list.splice(idx, 1);
        this.getModel("TipoImp").refresh();
      },

      addTipoImp() {
        if (!this.tipoEtqSelecionado) {
          return;
        }
        const list = this.getModelProperty("TipoImp", "list");
        list[list.length - 1].tipoEtq = this.tipoEtqSelecionado;
        list.push({ tipoEtq: null });
        this.getModel("TipoImp").refresh();
      },

      async onSavePressed() {
        const tiposEtq = this.getModelProperty("TipoEtq", "list").filter((t) => t.tipoEtq != null);
        const tipoImps = this.getModelProperty("Data", "tipoImps").filter((t) => t.tipoEtq != null);
        const checkDefault = [];
        for (let i = 0; i < tipoImps.length; i++) {
          const t = tipoImps[i];
          if (t.defaultChk) {
            if (checkDefault.includes(t.tipoEtq)) {
              this.showErrorMessageBox("Erro", `Mais de uma impressora default para tipo ${t.tipoEtq}`);
              return;
            }
            checkDefault.push(t.tipoEtq);
          }
          t.default = t.defaultChk ? 'Y' : 'N';
          if (!t.impressora) {
            this.showErrorMessageBox("Erro", `Tipo ${t.tipoEtq} sem impressora definida`);
              return;
          }
        }

        try {
          sap.ui.core.BusyIndicator.show();
          await this.serverService.post("/configuraImpressao/setConfigImpressao", { tiposEtq, tipoImps });
          this.showSuccessMessageBox("Gravada", "Configuração gravada");
          this.carregaDados();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao gravar Configuração", err);
        }
        sap.ui.core.BusyIndicator.hide();
      },


      async onEditaRegraPressed() {
        try {
          const regraFn = await this.serverService.get("/configuraImpressao/getRegraFn");
          this.setModel(new JSONModel(regraFn), "regraFn");
        } catch (err) {
          this.showExceptionMessageBox("Erro", "onEditaRegraPressed", err);
          return;
        }
        if (!this.editaRegraDialog) {
          this.editaRegraDialog = await Fragment.load({
            id: this.getView().getId(),
            name: "sps.wms.view.editaregra",
            controller: this
          });
          this.getView().addDependent(this.editaRegraDialog);
        }
        this.editaRegraDialog.open();

      },

      onCancelarSpPressed() {
        this.editaRegraDialog.close();
      },

      onGravarSpPressed() {
        this.showQuestion("Confirma", "Confirma gravar Função?",
          this.gravaFn.bind(this));
      },

      async gravaFn() {
        try {
          const regraFn = this.getModelData("regraFn");
          await this.serverService.post("/configuraImpressao/gravaRegraFn", regraFn);
          this.showSuccessMessageBox("Sucesso", "Função atualizada");
          this.editaRegraDialog.close();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "onGravarSpPressed", err);
        }
      },
    })
);
