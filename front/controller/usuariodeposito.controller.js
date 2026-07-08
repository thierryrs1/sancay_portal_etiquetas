/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel"],
  (BaseController, JSONModel) =>
    BaseController.extend("sps.wms.controller.usuariodeposito", {
      route: "usuariodeposito",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Usuario_Deposito) {
          this.navTo("home");
        }
        this.setModel(new JSONModel(), "Data");
        this.setModel(new JSONModel(), "Logins");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        this.carregaLogins();
        this.carregaDados();
      },

      async carregaLogins() {
        try {
          const logins = await this.serverService.get("/usuarioDeposito/getLogins");
          logins.splice(0, 0, { DocEntry: "", Descr: ""});
          this.setModelProperty("Logins", "list", logins);
        } catch (err) {
          this.showExceptionMessageBox("Erro", "getLogins", err);
        }
      },

      carregaDados: async function () {
        sap.ui.core.BusyIndicator.show();
        const data = this.getModel("Data");
        this.getView().byId("tblList").clearSelection();
        const tblList = this.getView().byId("tblList");
        const aColumns = tblList.getColumns();
        for (var i = 0; i < aColumns.length; i++) {
          tblList.filter(aColumns[i], null);
        }
        try {
          const login = this.getModelProperty("Data", "login");
          if (!login) {
            return;
          }
          const list = await this.serverService.post("/usuarioDeposito/getUsuarioDeposito", { login });

          const cols = Object.keys(list[0]);
          list.forEach((ln) => {
            cols.forEach((c) => {
              if (/^.+? _\(.+\)_.*K.*/.test(c)) {
                ln[c] = (ln[c] == 1);
              }
            });
          });

          if (!list || list.length == 0) {
            data.Items = [];
            this.setModelProperty("Data", "Items", []);
            sap.ui.core.BusyIndicator.hide();
            return;
          }

          

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
            const isChk = /K/.test(formatOpt);
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
            } else if (isChk) {
              template = new sap.m.CheckBox({
                selected: `{Data>${propName}}`
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
            "Erro buscando lista de usuário x depósito",
            ex
          );
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      onSavePressed: async function() {
        const list = this.getModelProperty("Data", "Items");
        
        try {
          sap.ui.core.BusyIndicator.show();
          await this.serverService.post("/usuarioDeposito/setUsuarioDeposito", { list });
          this.showSuccessMessageBox("Gravados", "Usuário x Depósito gravado");
          this.carregaDados();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao gravar Usuário x Depósito", err);
        }
        sap.ui.core.BusyIndicator.hide();
      },

    })
);
