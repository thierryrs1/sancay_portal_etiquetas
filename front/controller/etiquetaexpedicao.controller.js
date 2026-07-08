/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel"],
  (BaseController, JSONModel) =>
    BaseController.extend("sps.wms.controller.etiquetaexpedicao", {
      route: "etiquetaexpedicao",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Etiqueta_Expedicao) {
          this.navTo("home");
        }
        const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
        this.setModel(new JSONModel({ DataIni: "1900-01-01", DataFin: todayStr }), "Data");
        this.setModel(new JSONModel(), "Impressoras");
        this.setModel(new JSONModel({ items: [
          {
            objType: '',
            docName: "Todos"
          },
          {
            objType: 13, // OINV
            docName: "NF Saída"
          },
          {
            objType: 21, // ORPD
            docName: "Dev. Mercadoria"
          },
          {
            objType: 19, // ORPC
            docName: "Dev. NF Entrada"
          },
          {
            objType: 15, // ORPC
            docName: "NF Entrega"
          },
        ]}), "TipoDocs");

        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        this.carregaImpressorasExpedicao();
      },

      async carregaImpressorasExpedicao() {
        try {
          const impressoras = await this.serverService.post(`/etiqueta/getImpressorasExpedicao`);
          impressoras.splice(0, 0, { Impressora: "" });
          this.setModelProperty("Impressoras", "Items", impressoras);
          if (impressoras.length == 2) {
            this.setModelProperty("Data", "Impressora", impressoras[1].Impressora);
          } else if (impressoras.length > 2) {
            const df = impressoras.find((p) => p.default == "Y");
            if (df) {
              this.setModelProperty("Data", "Impressora", df.Impressora);
            }
          }
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getImpressorasExpedicao", err);
        }
      },

      carregaDados: async function () {
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
            data.dataIni || "",
            data.dataFin || "",
            data.objType || "",
            data.docNum || "",
          ];
          const list = await this.serverService.post(
            "/etiqueta/getListaEtiquetasExpedicao",
            {
              filter,
            }
          );

          if (!list || list.length == 0) {
            data.Items = [];
            this.setModelProperty("Data", "Items", []);
            sap.ui.core.BusyIndicator.hide();
            return;
          }

          if (list.length >= 5000) {
            this.showToast(
              "Mostrando os 5000 itens mais recentes; reveja o filtro."
            );
          }

          const cols = Object.keys(list[0]);

          // cria model limpando nomes das props
          const modelList = [];
          list.map((line) => {
            const newLine = {};
            cols.map((col) => {
              const propName = col.replace(/ _\(.+$/, "");
              newLine[propName] = line[col];
            });
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
                },
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
              : /Data/.test(label)
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

      onFilter: function () {
        this.carregaDados();
      },

      onClearForm: function () {
        const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
        this.setModel(new JSONModel({ DataIni: "1900-01-01", DataFin: todayStr }), "Data");
        this.getView().byId("tblList").clearSelection();
        const tblList = this.getView().byId("tblList");
        const aColumns = tblList.getColumns();
        for (var i = 0; i < aColumns.length; i++) {
          tblList.filter(aColumns[i], null);
        }
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
          this.showErrorMessageBox(
            "Erro",
            "Impressora não selecionada"
          );
          return;
        }

        const printJob = {
          impressora: data.Impressora,
          docs: [],
        };
        const model = this.getModel("Data");
        for (let i = 0; i < selectedIndices.length; i++) {
          const path = tblList.getContextByIndex(selectedIndices[i]).getPath();
          const item = model.getProperty(path);
          printJob.docs.push({
            docType: item.docType,
            docEntry: item.docEntry
          });
        }
        try {
          await this.serverService.post("/etiqueta/imprimeEtiquetasExpedicao", { printJob });
          this.showSuccessMessageBox("Enviado", "Enviado para impressão");
          this.carregaDados();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao imprimir", err);
        }
      },
    })
);
