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
        this.setModel(new JSONModel({ currentJson: "" }), "DialogModel");
        
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

          if (!dataIni || !dataFin) {
            sap.ui.core.BusyIndicator.hide();
            return;
          }

          const res = await this.serverService.post("/etiqueta/getLogImpressao", {
             dataIni, dataFin, login
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
              await this.serverService.post("/etiqueta/imprimeVolumes", {
                  impressora: rowData.Impressora,
                  tipo: rowData.TipoEtiqueta,
                  confVolumesLineKeys: rowData.Chaves,
                  visualizar: false,
                  numVolume: rowData.NumVolume
              });
              sap.ui.core.BusyIndicator.hide();
              MessageToast.show("Reimpressão enviada com sucesso!");
              await this.carregaDados(); // Atualiza a tabela com a nova impressão
          } catch(ex) {
              sap.ui.core.BusyIndicator.hide();
              this.showExceptionMessageBox("Erro", "Erro ao reimprimir", ex);
          }
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
                  numVolume: rowData.NumVolume
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
