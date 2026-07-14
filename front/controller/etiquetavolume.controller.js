/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel","sap/m/PDFViewer"],
  (BaseController, JSONModel, PDFViewer) =>
    BaseController.extend("sps.wms.controller.etiquetavolume", {
      route: "etiquetavolume",
      async initialize() {
        let perms = JSON.parse(sessionStorage.getItem("perms") || "{}");
        try {
          perms = await this.serverService.get("/getPerms");
          sessionStorage.setItem("perms", JSON.stringify(perms));
        } catch(e) {}

        if (!perms.Etiqueta_Volume) {
          this.navTo("home");
          return;
        }
        const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
        let favLang = localStorage.getItem('fav_lang');
        if (!favLang) favLang = "PTB";
        this.setModel(new JSONModel({ DataIni: "1900-01-01", DataFin: todayStr, Idioma: favLang, PodeVisualizar: perms.Visualizar_Etiqueta }), "Data");
        this.setModel(new JSONModel(), "TiposEtiqueta");
        this.setModel(new JSONModel(), "Estufas");
        this.setModel(new JSONModel(), "OrdensProducao");
        this.setModel(new JSONModel(), "Impressoras");
        this.setModel(new JSONModel(), "Fornecedores");
        this.setModelProperty("Data", "YesNo", [
          {
            key: "",
            text: ""
          },
          {
            key: "Y",
            text: "Sim"
          },
          {
            key: "N",
            text: "Não"
          }
        ]);
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        this.carregaTiposEtiqueta();
        this.carregaEstufas();
        this.carregaOrdensProducao();
        this.carregaImpressoras();
        this.carregaFornecedores();
      },

      async carregaOrdensProducao() {
        try {
          const ordens = await this.serverService.get("/etiqueta/getOrdensProducao");
          ordens.splice(0, 0, { Documento: "" });
          this.setModelProperty("OrdensProducao", "Items", ordens);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getOrdensProducao", err);
        }
      },

      async carregaEstufas() {
        try {
          const estufas = await this.serverService.get("/etiqueta/getEstufas");
          estufas.splice(0, 0, { APLATZ_ID: "" });
          this.setModelProperty("Estufas", "Items", estufas);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getEstufas", err);
        }
      },

      async carregaTiposEtiqueta() {
        try {
          const tiposEtiqueta = await this.serverService.get("/etiqueta/getTiposEtiquetaVolume");
          tiposEtiqueta.splice(0, 0, { DocEntry: "", Descr: ""});
          this.setModelProperty("TiposEtiqueta", "Items", tiposEtiqueta);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getTiposEtiquetaVolume", err);
        }
      },

      async carregaFornecedores() {
        try {
          const fornecedores = await this.serverService.get("/etiqueta/getFornecedoresVolume");
          fornecedores.splice(0, 0, { CardCode: "", Text: ""});
          this.setModelProperty("Fornecedores", "Items", fornecedores);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getFornecedoresVolume", err);
        }
      },

      async carregaImpressoras(tipoEtq) {
        if (!tipoEtq) {
          tipoEtq = "";
        }
        try {
          const impressoras = await this.serverService.post(`/etiqueta/getImpressorasVolume`, { tipoEtq });
          impressoras.splice(0, 0, { Impressora: "" });
          this.setModelProperty("Impressoras", "Items", impressoras);
          
          const currentPrinter = this.getModelProperty("Data", "Impressora");

          if (currentPrinter && impressoras.find(p => p.Impressora === currentPrinter)) {
            // Maintain the currently selected printer
          } else if (impressoras.length == 2) {
            this.setModelProperty("Data", "Impressora", impressoras[1].Impressora);
          } else if (impressoras.length > 2) {
            const df = impressoras.find((p) => p.default == "Y");
            if (df) {
              this.setModelProperty("Data", "Impressora", df.Impressora);
            } else {
              this.setModelProperty("Data", "Impressora", "");
            }
          } else {
            this.setModelProperty("Data", "Impressora", "");
          }
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getImpressorasVolume", err);
        }
      },

      onSaveFavoriteLang: function() {
        const selected = this.getModel("Data").getProperty("/Idioma");
        if (selected) {
          localStorage.setItem('fav_lang', selected);
          sap.m.MessageToast.show("Idioma " + selected + " salvo como padrão!");
        }
      },

      carregaDados: async function () {
        const data = this.getModel("Data").getData();
        if (!data.tipoEtq || data.tipoEtq === "") {
          this.showErrorMessageBox("Erro", "Por favor, selecione o Tipo de Etiqueta antes de consultar.");
          return;
        }
        
        sap.ui.core.BusyIndicator.show();
        this.getView().byId("tblList").clearSelection();
        const tblList = this.getView().byId("tblList");
        const aColumns = tblList.getColumns();
        for (var i = 0; i < aColumns.length; i++) {
          tblList.filter(aColumns[i], null);
        }
        try {
          const data = this.getModel("Data").getData();

          const filter = [
            data.ItemCode || "",
            data.Lote || "",
            data.DataIni || "",
            data.DataFin || "",
            data.tipoEtq || "",
            data.BoxCode || "",
            data.PalletCode || "",
            data.Estufa || "",
            data.OP || ""
          ];
          const list = await this.serverService.post("/etiqueta/getListaImpressoesVolume", {
            filter,
          });

          if (!list || list.length == 0) {
            data.Items = [];
            this.setModelProperty("Data", "Items", []);
            sap.ui.core.BusyIndicator.hide();
            return;
          }

          if (list.length >= 5000) {
            this.showToast("Mostrando os 5000 itens mais recentes; reveja o filtro.")
          }

          const cols = Object.keys(list[0]);

          // cria model limpando nomes das props
          const tipos = this.getModelProperty("TiposEtiqueta", "Items");
          const selectedTipo = tipos.find(t => t.tipoEtq === data.tipoEtq);
          const permiteCopias = selectedTipo && selectedTipo.controlaVolume === 'N';

          const modelList = [];
          list.map((line) => {
            const newLine = {};
            cols.map((col) => {
              const propName = col.replace(/ _\(.+$/, "");
              newLine[propName] = line[col];
            });
            if (permiteCopias) {
              newLine["CopiasDesejadas"] = 1;
            }
            modelList.push(newLine);
          });

          this.getModel("Data").setSizeLimit(modelList.length);

          this.setModelProperty("Data", "Items", modelList);

          // insere colunas na tabela

          tblList.destroyColumns();
          let visibleColCount = 0;
          for (let i = 0; i < cols.length; i++) {
            const capture = cols[i].match(/^(.+?) _\((.+)\)_(..?)/);
            if (!capture) {
              continue;
            }
            const propName = capture[1];
            const label = capture[2];
            const formatOpt = capture[3];
            const alignOpt = formatOpt.replace(/[0-9]/g, "");
            const isNumber = /[0-9]/.test(formatOpt);
            const isDate = /Data/.test(label);
            let decimals = "";
            if (isNumber) {
              decimals = capture[3].match(/([0-9]+)/)[1];
            }
            let hAlign = "Left";
            if (alignOpt) {
              if (alignOpt == "L") {
                hAlign = "Left";
              } else if (alignOpt == "C") {
                hAlign = "Center";
              } else if (alignOpt == "R") {
                hAlign = "Right";
              }
            }
            let template = {};
            if (isNumber) {
              template = new sap.m.ObjectStatus({
                text: {
                  path: `Data>${propName}`,
                  textAlign: hAlign,
                  type: new sap.ui.model.type.Float({
                    maxFractionDigits: decimals,
                    minFractionDigits: decimals,
                  }),
                }
              });
            } else {
              template = new sap.m.ObjectStatus({
                text: {
                  path: `Data>${propName}`,
                  textAlign: hAlign,
                },
              });
            }
            const filterType = isNumber
              ? "Float"
              : isDate
              ? "Date"
              : "String";
            let filterTypeObj;
            if (filterType == "Float")
              filterTypeObj = new sap.ui.model.type.Float();
            else if (filterType == "Date")
              filterTypeObj = new sap.ui.model.type.String();
            if (filterType == "String")
              filterTypeObj = new sap.ui.model.type.String();
            visibleColCount++;
            const column = new sap.ui.table.Column({
              label: new sap.m.Label({ text: label }),
              hAlign,
              template,
              autoResizable: true,
              filterProperty: propName,
              filterType: filterTypeObj,
            });

            tblList.addColumn(column);
          }

          if (permiteCopias) {
            const copiasColumn = new sap.ui.table.Column({
              label: new sap.m.Label({ text: "Cópias" }),
              hAlign: "Center",
              width: "8rem",
              template: new sap.m.StepInput({
                 value: "{Data>CopiasDesejadas}",
                 min: 1,
                 max: 999,
                 textAlign: "Center"
              })
            });
            tblList.addColumn(copiasColumn);
          }

        } catch (ex) {
          this.showExceptionMessageBox(
            "Erro",
            "Erro buscando lista de impressões",
            ex
          );
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      onFilter: function() {
        this.carregaDados();
      },

      onClearForm: function() {
        const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
        this.setModel(new JSONModel({ DataIni: "1900-01-01", DataFin: todayStr }), "Data");
        this.getView().byId("tblList").clearSelection();
        const tblList = this.getView().byId("tblList");
        const aColumns = tblList.getColumns();
        for (var i = 0; i < aColumns.length; i++) {
          tblList.filter(aColumns[i], null);
        }
      },

      onRowSelectionChange: function() {
        const tblList = this.getView().byId("tblList");
        const selectedIndices = tblList.getSelectedIndices();
        if (!selectedIndices || selectedIndices.length == 0) {
          this.tipoEtq = -1;
          this.carregaImpressoras();
          return;
        }
        
        const path = tblList.getContextByIndex(selectedIndices[0]).getPath();
        const model = this.getModel("Data");
        const item = model.getProperty(path);
        this.carregaImpressoras(item.tipoEtq);
        
      },

      onPrintPressed: async function () {
        const tblList = this.getView().byId("tblList");
        const selectedIndices = tblList.getSelectedIndices();
        if (!selectedIndices || selectedIndices.length == 0) {
          this.showErrorMessageBox("Erro", "Nenhuma linha selecionada");
          return;
        }
        const data = this.getModel("Data").getData();
        if (!data.Impressora || data.Impressora == "") {
          this.showErrorMessageBox("Erro", "Impressora não selecionada");
          return;
        }

        const tipos = this.getModelProperty("TiposEtiqueta", "Items");
        const selectedTipo = tipos.find(t => t.tipoEtq === data.tipoEtq);
        const permiteCopias = selectedTipo && selectedTipo.controlaVolume === 'N';

        const confVolumesLineKey = [];
        const jsonDataList = [];
        const tipo = [];
        let numVol = '';
        const model = this.getModel("Data");
        
        try {
          if (permiteCopias) {
            sap.ui.core.BusyIndicator.show();
            for (let i = 0; i < selectedIndices.length; i++) {
              const path = tblList.getContextByIndex(selectedIndices[i]).getPath();
              const item = model.getProperty(path);
              
              let key = item.confVolumesLineKey;
              if (data.Idioma) {
                key += `@${data.Idioma}@`;
              } else {
                key += `@PTB@`;
              }
              const copias = parseInt(item.CopiasDesejadas, 10) || 1;
              const tipoFinal = item.tipoEtq || data.tipoEtq;
              
              if (data.VisualizaVol == true) {
                await this.serverService.post("/etiqueta/imprimeVolumes", { impressora: data.Impressora, tipo: tipoFinal, confVolumesLineKeys: key, visualizar:false, numVolume: item.VOL, jsonDataList: [item], copias});
              } else {
                await this.serverService.post("/etiqueta/imprimeVolumes", { impressora: data.Impressora, tipo: tipoFinal, confVolumesLineKeys: key, visualizar: false, jsonDataList: [item], copias});
              }
            }
          } else {
            for (let i = 0; i < selectedIndices.length; i++) {
              const path = tblList.getContextByIndex(selectedIndices[i]).getPath();
              const item = model.getProperty(path);
              if (i==0)
                numVol = item.VOL;
              
              let key = item.confVolumesLineKey;
              if (data.Idioma) {
                key += `@${data.Idioma}@`;
              } else {
                key += `@PTB@`;
              }
              confVolumesLineKey.push(key);
              jsonDataList.push(item);
              
              if (tipo.length === 0) { tipo.push(item.tipoEtq) };
            }

            const tipoFinal = tipo[0] || data.tipoEtq;
            if ( data.VisualizaVol == true) {
              await this.serverService.post("/etiqueta/imprimeVolumes", { impressora: data.Impressora, tipo: tipoFinal, confVolumesLineKeys: confVolumesLineKey.join(","), visualizar:false, numVolume: numVol, jsonDataList});
            } else {
              await this.serverService.post("/etiqueta/imprimeVolumes", { impressora: data.Impressora, tipo: tipoFinal, confVolumesLineKeys: confVolumesLineKey.join(","), visualizar: false, jsonDataList});
            }
          }
          this.showSuccessMessageBox("Enviado", "Enviado para impressão");
          this.carregaDados();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao imprimir", err);
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
        
      },

      onVisualizarPressed: async function () {
        const tblList = this.getView().byId("tblList");
        const selectedIndices = tblList.getSelectedIndices();
        if (!selectedIndices || selectedIndices.length == 0) {
          this.showErrorMessageBox("Erro", "Nenhuma linha selecionada");
          return;
        }
        const data = this.getModel("Data").getData();
        if (!data.Impressora || data.Impressora == "") {
          this.showErrorMessageBox("Erro", "Impressora não selecionada");
          return;
        }
      
        const confVolumesLineKey = [];
        let pdfName = '';
        let numVol = '';
        const tipo = [];
        const model = this.getModel("Data");
        for (let i = 0; i < selectedIndices.length; i++) {
          const path = tblList.getContextByIndex(selectedIndices[i]).getPath();
          const item = model.getProperty(path);
          if (i==0)
            numVol = item.VOL;

          let key = item.confVolumesLineKey;
          if (data.Idioma) {
            key += `@${data.Idioma}@`;
          } else {
            key += `@PTB@`;
          }
          confVolumesLineKey.push(key);

          if (tipo.length === 0) { tipo.push(item.tipoEtq) };
        }
        try {
          const tipoFinal = tipo[0] || data.tipoEtq;
          if ( data.VisualizaVol == true) {
            pdfName = await this.serverService.post("/etiqueta/imprimeVolumes", { impressora: data.Impressora, tipo: tipoFinal, confVolumesLineKeys: confVolumesLineKey.join(","), visualizar:true, numVolume: numVol});
          } else {
            pdfName = await this.serverService.post("/etiqueta/imprimeVolumes", { impressora: data.Impressora, tipo: tipoFinal, confVolumesLineKeys: confVolumesLineKey.join(","), visualizar:true});
          }
          this.openPDF(pdfName);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao visualizar", err);
        }
      },

      openPDF: async function (pdfName){
        const pdfViewer = new PDFViewer();
        this.getView().addDependent(pdfViewer);
        pdfViewer.setSource(pdfName);
        pdfViewer.setTitle("Pré-Visualização de Etiqueta");
        pdfViewer.setVisible(true);
        pdfViewer.open(); 
      },
    })
);
