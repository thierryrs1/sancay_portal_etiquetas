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
        const data = {
          procs: [],
          tiposEtq: [],
          tipoImps: [],
        };
        this.setModel(new sap.ui.model.json.JSONModel(data), "Data");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        this.setModel(new sap.ui.model.json.JSONModel({ list: [] }), "TipoEtq");
        this.setModel(new sap.ui.model.json.JSONModel({ list: [] }), "TipoImp");
        this.setModel(new sap.ui.model.json.JSONModel({ list: [] }), "Impressoras");
        this.setModel(new sap.ui.model.json.JSONModel({ list: [] }), "Procedures");
        this.setModel(new sap.ui.model.json.JSONModel({ list: [], TipoEtqSelecionado: "" }), "ConfigTags");
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

      onOpenIconModal: function (oEvent) {
        const oSource = oEvent.getSource();
        const oContext = oSource.getBindingContext("TipoEtq");
        
        if (!this._oIconDialog) {
          this._oIconDialog = this.getView().byId("iconDialog");
        }
        this._oIconDialog.setBindingContext(oContext, "TipoEtq");
        this._oIconDialog.open();
      },

      onCloseIconModal: function () {
        if (this._oIconDialog) {
          this._oIconDialog.close();
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

      deleteTipoImp(oEvent) {
        const rowData = oEvent.getSource().getBindingContext("TipoImp").getProperty();
        const dataList = this.getModelProperty("Data", "tipoImps");
        const dataIdx = dataList.indexOf(rowData);
        if (dataIdx > -1) {
          dataList.splice(dataIdx, 1);
        }
        this.carregaTipoImps(this.tipoEtqSelecionado);
      },

      onManualSelect: function(oEvent) {
        const selected = oEvent.getParameter("selected");
        const path = oEvent.getSource().getBindingContext("TipoEtq").getPath();
        this.getModel("TipoEtq").setProperty(path + "/isManual", selected ? "Y" : "N");
      },

      onControlaVolumeSelect: function(oEvent) {
        const selected = oEvent.getParameter("selected");
        const path = oEvent.getSource().getBindingContext("TipoEtq").getPath();
        this.getModel("TipoEtq").setProperty(path + "/controlaVolume", selected ? "Y" : "N");
      },

      onControlaIdiomaSelect: function(oEvent) {
        const selected = oEvent.getParameter("selected");
        const path = oEvent.getSource().getBindingContext("TipoEtq").getPath();
        this.getModel("TipoEtq").setProperty(path + "/controlaIdioma", selected ? "Y" : "N");
      },

      addTipoImp() {
        if (!this.tipoEtqSelecionado) {
          return;
        }
        const list = this.getModelProperty("TipoImp", "list");
        list[list.length - 1].tipoEtq = this.tipoEtqSelecionado;
        
        const novoItem = { tipoEtq: null };
        list.push(novoItem);
        this.getModelProperty("Data", "tipoImps").push(novoItem);
        
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

      async onConfigurarTags() {
        const idx = this.byId("tblTipoEtq").getSelectedIndex();
        if (idx < 0) {
          this.showErrorMessageBox("Atenção", "Selecione um Tipo de Etiqueta na tabela primeiro.");
          return;
        }
        
        const tipoObj = this.getModel("TipoEtq").getProperty("/list/" + idx);
        if (!tipoObj || !tipoObj.tipoEtq) {
          return;
        }
        if (tipoObj.isManual !== 'Y') {
          this.showErrorMessageBox("Atenção", "Esta configuração só é útil para etiquetas manuais.");
        }
        
        const prn = tipoObj.pathPrn || "";
        const regex = /<([^>]+)>/g;
        let match;
        const prnTags = [];
        
        if (tipoObj.procedure) {
            prnTags.push("@PARAMETRO@");
        }
        
        while ((match = regex.exec(prn)) !== null) {
          const tag = match[1];
          if (!prnTags.includes(tag)) {
            prnTags.push(tag);
          }
        }
        
        sap.ui.core.BusyIndicator.show();
        try {
          const bdTags = await this.serverService.post("/configuraImpressao/getTags", { tipoEtq: tipoObj.tipoEtq });
          
          const list = prnTags.map(t => {
            const found = bdTags.find(b => b.tag === t);
            return {
              tag: t,
              consulta: found ? found.consulta : ""
            };
          });
          
          this.getModel("ConfigTags").setProperty("/TipoEtqSelecionado", tipoObj.tipoEtq);
          this.getModel("ConfigTags").setProperty("/list", list);
          
          this.byId("tagsDialog").open();
        } catch (e) {
          this.showExceptionMessageBox("Erro", "Erro ao carregar tags do banco.", e);
        }
        sap.ui.core.BusyIndicator.hide();
      },

      onCloseTagsDialog() {
        this.byId("tagsDialog").close();
      },

      async onSaveTags() {
        const tipoEtq = this.getModel("ConfigTags").getProperty("/TipoEtqSelecionado");
        const list = this.getModel("ConfigTags").getProperty("/list");
        
        sap.ui.core.BusyIndicator.show();
        try {
          await this.serverService.post("/configuraImpressao/saveTags", {
            tipoEtq: tipoEtq,
            tags: list
          });
          this.showSuccessMessageBox("Sucesso", "Configurações salvas.");
          this.byId("tagsDialog").close();
        } catch (e) {
          this.showExceptionMessageBox("Erro", "Erro ao salvar.", e);
        }
        sap.ui.core.BusyIndicator.hide();
      },

      async onIdiomasPressed() {
        sap.ui.core.BusyIndicator.show();
        try {
          const idiomas = await this.serverService.get("/configuraImpressao/getIdiomas");
          this.setModel(new sap.ui.model.json.JSONModel({ list: idiomas }), "Idiomas");

          if (!this.idiomasDialog) {
            this.idiomasDialog = await sap.ui.core.Fragment.load({
              id: this.getView().getId(),
              name: "sps.wms.view.idiomas",
              controller: this
            });
            this.getView().addDependent(this.idiomasDialog);
          }
          this.idiomasDialog.open();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao carregar idiomas", err);
        }
        sap.ui.core.BusyIndicator.hide();
      },

      onAddIdioma() {
        const list = this.getModel("Idiomas").getProperty("/list");
        list.push({ sigla: "", descricao: "" });
        this.getModel("Idiomas").refresh();
      },

      onDeleteIdioma(oEvent) {
        const path = oEvent.getSource().getBindingContext("Idiomas").getPath();
        const idx = parseInt(path.split("/")[2]);
        const list = this.getModel("Idiomas").getProperty("/list");
        list.splice(idx, 1);
        this.getModel("Idiomas").refresh();
      },

      onCancelarIdiomas() {
        this.idiomasDialog.close();
      },

      async onGravarIdiomas() {
        const list = this.getModel("Idiomas").getProperty("/list");
        sap.ui.core.BusyIndicator.show();
        try {
          await this.serverService.post("/configuraImpressao/saveIdiomas", list);
          this.showSuccessMessageBox("Sucesso", "Idiomas gravados com sucesso!");
          this.idiomasDialog.close();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao gravar idiomas", err);
        }
        sap.ui.core.BusyIndicator.hide();
      }

    })
);
