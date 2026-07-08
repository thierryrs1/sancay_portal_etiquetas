/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel"],
  (BaseController, JSONModel) =>
    BaseController.extend("sps.wms.controller.cancelapicking", {
      route: "cancelapicking",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Gerenciamento_Picking) {
          this.navTo("home");
        }
        this.setModel(new JSONModel(), "Data");

        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));

        this.carregaPickings();
      },

      async carregaPickings() {
        sap.ui.core.BusyIndicator.show();
        this.getView().byId("tblList").clearSelection();
        const tblList = this.getView().byId("tblList");
        const aColumns = tblList.getColumns();
        for (var i = 0; i < aColumns.length; i++) {
          tblList.filter(aColumns[i], null);
        }
        try {
          const data = this.getModel("Data").getData();

          const list = await this.serverService.get("/picking/getListaCancelaPicking");

          if (!list || list.length == 0) {
            data.Items = [];
            this.setModelProperty("Data", "Items", []);
            sap.ui.core.BusyIndicator.hide();
            return;
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
          let colCount = 0;
          for (let i = 0; i < cols.length; i++) {
            const capture = cols[i].match(/^(.+?) _\((.+)\)_(.{0,3})/);
            if (!capture) {
              continue;
            }
            const propName = capture[1];
            const label = capture[2];
            const formatOpt = capture[3];
            const isInput = /I/.test(formatOpt);
            const alignOpt = formatOpt.replace(/[0-9I]/g, "");
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
            if (!isInput) {
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
                if (isDate) {
                  template = new sap.m.ObjectStatus({
                    text: {
                      path: `Data>${propName}`,
                      textAlign: hAlign,
                      formatter: this.formatDate
                    }
                  });
                } else {
                  template = new sap.m.ObjectStatus({
                    text: {
                      path: `Data>${propName}`,
                      textAlign: hAlign,
                    },
                    state: propName != "dispQuantity" ? "None" :
                      "{= ${Data>loteSerialReservado}==='Sim'?'Warning':'None' }"
                  });
                }
              }
            } else {
              template = new sap.m.Input({
                textAlign: hAlign,
                type: isNumber ? sap.m.InputType.Number : sap.m.InputType.Text,
                value: { path: `Data>${propName}` },
                change: this.inputChanged.bind(this)
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

            const column = new sap.ui.table.Column({
              label: new sap.m.Label({ text: label }),
              hAlign,
              template,
              autoResizable: true,
              filterProperty: propName,
              filterType: filterTypeObj,
            });

            tblList.addColumn(column);
            colCount++;
          }
          setTimeout(function () {
            for (let i = 0; i < colCount; i++) {
              tblList.autoResizeColumn(i);
            }
            sap.ui.core.BusyIndicator.hide();
          }, 100);
        } catch (ex) {
          sap.ui.core.BusyIndicator.hide();
          this.showExceptionMessageBox(
            "Erro",
            "Erro buscando lista de pickings",
            ex
          );
        }
      },


      onCancelarPressed() {
        const tblList = this.getView().byId("tblList");
        const selectedIndices = tblList.getSelectedIndices();
        if (!selectedIndices || selectedIndices.length == 0) {
          this.showErrorMessageBox("Erro", "Nenhuma linha selecionada");
          return;
        }
        this.showQuestion("Confirma", "Confirma remover pickings selecionados?\nEssa operação não pode ser desfeita.",
          this.cancelaPickings.bind(this));
      },


      async cancelaPickings() {
        const tblList = this.getView().byId("tblList");
        const selectedIndices = tblList.getSelectedIndices();
        const pickingDocEntries = [];
        const model = this.getModel("Data");
        for (let i = 0; i < selectedIndices.length; i++) {
          const path = tblList.getContextByIndex(selectedIndices[i]).getPath();
          const it = model.getProperty(path);
          pickingDocEntries.push(it.pkDocEntry);
        }
        sap.ui.core.BusyIndicator.show();
        try {
          await this.serverService.post("/picking/cancelaPickings", { pickingDocEntries });
          this.showSuccessMessageBox("Sucesso", "Cancelamento efetuado");
          await this.carregaPickings();
        } catch (ex) {
          this.showExceptionMessageBox("Erro", "Erro processando cancelamento", ex);
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      formatDate(date) {
        return date ? date.replace(/(....)-(..)-(..)/, "$3/$2/$1") : date;
      }

    })
);
