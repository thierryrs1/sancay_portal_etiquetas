sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel", "sap/m/MessageBox", "sap/m/MessageToast"],
  (BaseController, JSONModel, MessageBox, MessageToast) =>
    BaseController.extend("sps.wms.controller.logimpressao", {
      route: "logimpressao",
      async initialize() {
        this.setModel(new JSONModel(), "Data");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        
        // Padrão: Últimos 3 dias
        const d = new Date();
        const dataF = d.toISOString().split('T')[0];
        d.setDate(d.getDate() - 3);
        const dataI = d.toISOString().split('T')[0];

        this.setModelProperty("Data", "DataIni", dataI);
        this.setModelProperty("Data", "DataFin", dataF);
        this.setModelProperty("Data", "Login", "");
        this.setModelProperty("Data", "TipoEtiqueta", "");
        this.setModelProperty("Data", "Impressora", "");
        this.setModelProperty("Data", "Chaves", "");
        this.setModelProperty("Data", "IsReimpressa", "");
        this.setModelProperty("Data", "IdEtiqueta", "");
        this.setModel(new JSONModel({ currentJson: "" }), "DialogModel");
        
        try {
            const filtros = await this.serverService.get("/etiqueta/getFiltrosLogImpressao");
            this.setModelProperty("Data", "FilterLogins", filtros.logins);
            this.setModelProperty("Data", "FilterTipos", filtros.tipos);
            this.setModelProperty("Data", "FilterImpressoras", filtros.impressoras);
            if (filtros.minDate) this.setModelProperty("Data", "DataIni", filtros.minDate);
            if (filtros.maxDate) this.setModelProperty("Data", "DataFin", filtros.maxDate);
        } catch(e) {}

        await this.carregaDados();
      },
      
      onSearchPressed: async function() {
        await this.carregaDados();
      },

      carregaDados: async function () {
        try {
          sap.ui.core.BusyIndicator.show(0);
          const dataIni = this.getModelProperty("Data", "DataIni");
          const dataFin = this.getModelProperty("Data", "DataFin");
          const login = this.getModelProperty("Data", "Login") || '';
          const tipoEtiqueta = this.getModelProperty("Data", "TipoEtiqueta") || '';
          const impressora = this.getModelProperty("Data", "Impressora") || '';
          const chaves = this.getModelProperty("Data", "Chaves") || '';
          const isReimpressa = this.getModelProperty("Data", "IsReimpressa") || '';
          const idEtiqueta = this.getModelProperty("Data", "IdEtiqueta") || '';

          if (!dataIni || !dataFin) {
            sap.ui.core.BusyIndicator.hide();
            return;
          }

          const res = await this.serverService.post("/etiqueta/getLogImpressao", {
             dataIni, dataFin, login, tipoEtiqueta, impressora, chaves, isReimpressa, idEtiqueta
          });

          // Busca ícones
          let tiposEtq = [];
          try {
              tiposEtq = await this.serverService.get("/configuraImpressao/getTiposEtq");
          } catch(e) {}

          const mapIcones = {};
          tiposEtq.forEach(t => {
              if (t.icon) mapIcones[t.tipoEtq] = t.icon;
          });

          res.forEach(r => {
              r.Icone = mapIcones[r.TipoEtiqueta] || "sap-icon://tag";
          });

          this.getModel("Data").setSizeLimit(res.length);
          this.setModelProperty("Data", "Items", res);

          sap.ui.core.BusyIndicator.hide();
        } catch (ex) {
          this.showExceptionMessageBox("Erro", "Erro consultando log de impressões", ex);
          sap.ui.core.BusyIndicator.hide();
        }
      },
      
      onReprint: async function(oEvent) {
          const rowData = oEvent.getSource().getBindingContext("Data").getProperty();
          
          try {
              sap.ui.core.BusyIndicator.show(0);
              const { exists } = await this.serverService.post("/etiqueta/validaEtiqueta", { tipo: rowData.TipoEtiqueta });
              sap.ui.core.BusyIndicator.hide();
              
              if (!exists) {
                  MessageBox.error("Modelo de etiqueta não existe mais.");
                  return;
              }
          } catch(ex) {
              sap.ui.core.BusyIndicator.hide();
              this.showExceptionMessageBox("Erro", "Erro ao validar etiqueta", ex);
              return;
          }

          if (!this._reprintDialog) {
              this._reprintDialog = new sap.m.Dialog({
                  title: "Motivo da Reimpressão",
                  contentWidth: "400px",
                  content: new sap.m.VBox({
                      items: [
                          new sap.m.Label({ text: "Selecione ou digite o motivo:" }).addStyleClass("sapUiTinyMarginBottom"),
                          new sap.m.ComboBox(this.createId("motivoComboBox"), {
                              width: "100%",
                              items: [
                                  new sap.ui.core.Item({ key: "Etiqueta Rasgada/Amassada", text: "Etiqueta Rasgada/Amassada" }),
                                  new sap.ui.core.Item({ key: "Impressora Falhou/Atolou", text: "Impressora Falhou/Atolou" }),
                                  new sap.ui.core.Item({ key: "Troca de Ribbon/Papel", text: "Troca de Ribbon/Papel" }),
                                  new sap.ui.core.Item({ key: "Etiqueta Ilegível/Apagada", text: "Etiqueta Ilegível/Apagada" })
                              ]
                          })
                      ]
                  }).addStyleClass("sapUiSmallMargin"),
                  beginButton: new sap.m.Button({
                      text: "Confirmar",
                      type: "Emphasized",
                      press: async () => {
                          const motivo = this.byId("motivoComboBox").getValue();
                          if (!motivo) {
                              MessageToast.show("Informe o motivo da reimpressão.");
                              return;
                          }
                          this._reprintDialog.close();
                          
                          try {
                              sap.ui.core.BusyIndicator.show(0);
                              await this.serverService.post("/etiqueta/imprimeVolumes", {
                                  impressora: this._currentReprintRow.Impressora,
                                  tipo: this._currentReprintRow.TipoEtiqueta,
                                  confVolumesLineKeys: this._currentReprintRow.Chaves,
                                  visualizar: false,
                                  numVolume: this._currentReprintRow.NumVolume,
                                  jsonDataList: this._currentReprintRow.JSON_Data ? [JSON.parse(this._currentReprintRow.JSON_Data)] : [],
                                  logIdOrigem: (this._currentReprintRow.Reimpressao === 'Y' && this._currentReprintRow.IdLogOrigem) ? this._currentReprintRow.IdLogOrigem : this._currentReprintRow.LogId,
                                  motivoReimpressao: motivo
                              });
                              sap.ui.core.BusyIndicator.hide();
                              MessageToast.show("Reimpressão enviada com sucesso!");
                              await this.carregaDados();
                          } catch(ex) {
                              sap.ui.core.BusyIndicator.hide();
                              this.showExceptionMessageBox("Erro", "Erro ao reimprimir", ex);
                          }
                      }
                  }),
                  endButton: new sap.m.Button({
                      text: "Cancelar",
                      press: () => {
                          this._reprintDialog.close();
                      }
                  }),
                  afterClose: () => {
                      this.byId("motivoComboBox").setValue("");
                  }
              });
              this.getView().addDependent(this._reprintDialog);
          }
          
          this._currentReprintRow = rowData;
          this._reprintDialog.open();
      },

      onPreview: async function(oEvent) {
          const rowData = oEvent.getSource().getBindingContext("Data").getProperty();
          try {
              sap.ui.core.BusyIndicator.show(0);
              const pdfName = await this.serverService.post("/etiqueta/imprimeVolumes", {
                  impressora: rowData.Impressora,
                  tipo: rowData.TipoEtiqueta,
                  confVolumesLineKeys: rowData.Chaves,
                  visualizar: true,
                  numVolume: rowData.NumVolume,
                  jsonDataList: rowData.JSON_Data ? [JSON.parse(rowData.JSON_Data)] : []
              });
              sap.ui.core.BusyIndicator.hide();
              this.openPDF(pdfName);
          } catch(ex) {
              sap.ui.core.BusyIndicator.hide();
              this.showExceptionMessageBox("Erro", "Erro ao visualizar", ex);
          }
      },

      onViewJSON: function(oEvent) {
          const rowData = oEvent.getSource().getBindingContext("Data").getProperty();
          if (!rowData.JSON_Data) {
              return;
          }
          
          let formattedJson = rowData.JSON_Data;
          try {
              const parsed = JSON.parse(rowData.JSON_Data);
              formattedJson = JSON.stringify(parsed, null, 4);
          } catch (e) {
              // Se nao for json valido ignora
          }

          this.getModel("DialogModel").setProperty("/currentJson", formattedJson);

          if (!this._jsonDialog) {
              this._jsonDialog = new sap.m.Dialog({
                  title: "Payload da Etiqueta",
                  contentWidth: "600px",
                  contentHeight: "500px",
                  resizable: true,
                  content: new sap.m.ScrollContainer({
                      horizontal: true,
                      vertical: true,
                      height: "100%",
                      width: "100%",
                      content: [
                          new sap.m.Text({
                              text: "{DialogModel>/currentJson}",
                              renderWhitespace: true
                          }).addStyleClass("sapUiSmallMargin")
                      ]
                  }),
                  beginButton: new sap.m.Button({
                      icon: "sap-icon://copy",
                      text: "Copiar",
                      press: () => {
                          const textToCopy = this.getModel("DialogModel").getProperty("/currentJson");
                          navigator.clipboard.writeText(textToCopy);
                          sap.m.MessageToast.show("Copiado para a área de transferência!");
                      }
                  }),
                  endButton: new sap.m.Button({
                      text: "Fechar",
                      press: () => {
                          this._jsonDialog.close();
                      }
                  })
              });
              this.getView().addDependent(this._jsonDialog);
          }
          
          this._jsonDialog.open();
      },

      openPDF: async function (pdfName){
        const pdfViewer = new sap.m.PDFViewer({
          title: "Visualização da Etiqueta",
          showDownloadButton: false
        });
        this.getView().addDependent(pdfViewer);
        pdfViewer.setSource(pdfName);
        pdfViewer.open();
      }

    })
);
