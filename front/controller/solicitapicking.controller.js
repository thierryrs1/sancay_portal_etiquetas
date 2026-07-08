/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel"],
  (BaseController, JSONModel) =>
    BaseController.extend("sps.wms.controller.solicitapicking", {
      route: "solicitapicking",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Gerenciamento_Picking) {
          this.navTo("home");
        }
        this.setModel(new JSONModel(), "Data");

        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));

        this.carregaPedidos();
      },

      async carregaPedidos() {
        sap.ui.core.BusyIndicator.show();
        this.getView().byId("tblList").clearSelection();
        const tblList = this.getView().byId("tblList");
        const aColumns = tblList.getColumns();
        for (var i = 0; i < aColumns.length; i++) {
          tblList.filter(aColumns[i], null);
        }
        try {
          const data = this.getModel("Data").getData();

          const list = await this.serverService.get("/picking/getListaPedidos");

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
                width: "7em",
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
            "Erro buscando lista de pedidos",
            ex
          );
        }
      },

      inputChanged(ev) {
        const input = ev.getSource();
        const bind = input.getParent().getBindingContext("Data");
        const path = bind.getPath();
        const idx = path.replace("/Items/", "");
        const list = this.getModelProperty("Data", "Items");
        const it = list[idx];
        const pickQuantity = +it.pickQuantity;
        const origPendQuantity = +it.origPendQuantity;
        if (pickQuantity > origPendQuantity) {
          this.showErrorMessageBox("Erro", "Quantidade maior que a pendente");
          it.pickQuantity = 0;
        }
        it.pendQuantity = origPendQuantity - it.pickQuantity;
        this.checkUpdateDisponivel(-1);
      },

      onRowSelectionChange(ev) {
        let rowIndex = -9;
        const context = ev.getParameter("rowContext");
        if (context) {
          const path = context.getPath();
          rowIndex = +(path.replace(/^.+\/([0-9]+)$/, "$1"));
        }
        this.checkUpdateDisponivel(rowIndex);
      },

      checkUpdateDisponivel(row) {
        const tblList = this.getView().byId("tblList");
        const model = this.getModel("Data");
        const selectedIndices = tblList.getSelectedIndices();
        let desselecionadoAgora = false;
        if (row >= 0) {
          if (!selectedIndices.includes(row)) {
            desselecionadoAgora = true;
          } else {
            row = -1;
          }
        }
        let temExcedente = false;
        const qtdItem = {};
        for (let i = 0; i < selectedIndices.length; i++) {
          const path = tblList.getContextByIndex(selectedIndices[i]).getPath();
          const it = model.getProperty(path);
          if (it.loteSerialReservado == "Sim") {
            continue;
          }
          const itemCode = it.itemCode;
          if (!(itemCode in qtdItem)) {
            qtdItem[itemCode] = {};
            qtdItem[itemCode].disp = it.origDispQuantity;
            qtdItem[itemCode].totUsed = 0;
          }
          qtdItem[itemCode].totUsed += (i == row) ? 0 : +it.pickQuantity;
          if (qtdItem[itemCode].totUsed > qtdItem[itemCode].disp) {
            this.showErrorMessageBox("Erro", `Quantidade total para o item ${itemCode} excede a disponível`);
            temExcedente = true;
            break;
          }
        }
        const list = this.getModelProperty("Data", "Items");

        if (desselecionadoAgora) {
          const it = list[row];
          if (!(it.itemCode in qtdItem)) {
            qtdItem[it.itemCode] = {};
            qtdItem[it.itemCode].disp = it.origDispQuantity;
            qtdItem[it.itemCode].totUsed = 0;
          }
        }

        if (row == -9 && selectedIndices.length == 0) {
          for (let i = 0; i < list.length; i++) {
            const it = list[i];
            it.dispQuantity = it.origDispQuantity;
          }
        } else {
          for (let i = 0; i < list.length; i++) {
            const it = list[i];
            if (it.loteSerialReservado == "Sim") {
              continue;
            }
            const itemCode = it.itemCode;
            if (itemCode in qtdItem) {
              it.dispQuantity = it.origDispQuantity - qtdItem[itemCode].totUsed;
            }
          }
        }
        model.refresh();
        return !temExcedente;
      },

      onSolicitarPressed() {
        if (!this.checkUpdateDisponivel(-9)) {
          return;
        }
        const tblList = this.getView().byId("tblList");
        const selectedIndices = tblList.getSelectedIndices();
        if (!selectedIndices || selectedIndices.length == 0) {
          this.showErrorMessageBox("Erro", "Nenhuma linha selecionada");
          return;
        }
        const ordrData = [];
        const model = this.getModel("Data");
        for (let i = 0; i < selectedIndices.length; i++) {
          const path = tblList.getContextByIndex(selectedIndices[i]).getPath();
          const it = model.getProperty(path);
          if (+it.pickQuantity <= 0 || +it.dispQuantity < 0) {
            continue;
          }

          ordrData.push({
            ordrDocEntry: it.ordrDocEntry,
            rdr1LineNum: it.rdr1LineNum,
            pickQuantity: it.pickQuantity
          });
        }

        if (ordrData.length == 0) {
          this.showErrorMessageBox("Erro", "Nenhuma linha com quantidades válidas selecionada");
          return;
        }
        this.criaPickings(ordrData);
      },

      async criaPickings(ordrData) {
        sap.ui.core.BusyIndicator.show();
        try {
          await this.serverService.post("/picking/criaPickings", { ordrData });
          this.showSuccessMessageBox("Sucesso", "Solicitação de picking criada");
          await this.carregaPedidos();
        } catch (ex) {
          this.showExceptionMessageBox("Erro", "Erro criando solicitação", ex);
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

      formatDate(date) {
        return date ? date.replace(/(....)-(..)-(..)/, "$3/$2/$1") : date;
      }

    })
);
