/* eslint-disable no-unused-vars */
/* eslint-disable no-empty-function */
/* eslint-disable no-undef */
sap.ui.define(
  ["sps/wms/controller/BaseController", "sap/ui/model/json/JSONModel"],
  (BaseController, JSONModel) =>
    BaseController.extend("sps.wms.controller.permissoes", {
      route: "permissoes",
      async initialize() {
        const perms = JSON.parse(sessionStorage.getItem("perms"));
        if (!perms.Permissoes) {
          this.navTo("home");
        }
        this.setModel(new JSONModel(), "Data");
        this.setModelProperty("Data", "CompanyName", sessionStorage.getItem("companyName"));
        this.setModel(new JSONModel({ list: [ /*{ nome: "Coletor" },*/ { nome: "Portal"} ]}), "Sistemas");
        this.setModelProperty("Data", "Sistema", "Portal");
        this.carregaDados();
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

          const res = await this.serverService.get("/permissoes/getPermissoes");
          const list = res.filter((r) => r.login != -1 && r.login != "manager");

          if (!list || list.length == 0) {
            data.Items = [];
            this.setModelProperty("Data", "Items", []);
            sap.ui.core.BusyIndicator.hide();
            return;
          }

          const allCols = Object.keys(list[0]);
          const sistema = this.getModelProperty("Data", "Sistema");
          const allowedCols = ["login", "Portal.Permissoes", "Portal.Configura_Impressao", "Portal.Etiqueta_Volume"];
          const cols = allCols.filter((c) => allowedCols.includes(c));

          list.forEach((ln) => {
            allCols.forEach((c) => {
              if (c != "login") {
                ln[c] = (ln[c] == 'Y');
              }
            });
          });

          this.getModel("Data").setSizeLimit(list.length);

          this.setModelProperty("Data", "Items", list);

          // insere colunas na tabela
          tblList.destroyColumns();
          const rex = new RegExp(`^${sistema}\.`);
          for (let i = 0; i < cols.length; i++) {
            const propName = cols[i];
            let label = cols[i].replace(rex, "").replace("_", " ");
            if (propName === "Portal.Etiqueta_Volume") label = "Impressão Etiqueta";
            if (propName === "Portal.Permissoes") label = "Permissões";
            if (propName === "Portal.Configura_Impressao") label = "Configura Impressão";
            
            let hAlign = "Center";
            
            let template = {};
            if (propName == "login") {
              template = new sap.m.ObjectStatus({
                text: {
                  path: `Data>${propName}`,
                  textAlign: "Left",
                },
              });
            } else {
              template = new sap.m.CheckBox({
                selected: `{Data>${propName}}`
              });
            }
            
            const filterTypeObj = new sap.ui.model.type.String();
            
            const column = new sap.ui.table.Column({
              label: new sap.m.Label({ text: label }),
              hAlign,
              template,
              width: "15rem",
              autoResizable: true,
              filterProperty: propName == "login" ? "login" : null,
              filterType: propName == "login" ? filterTypeObj: null
            });

            tblList.addColumn(column);
          }
          
        } catch (ex) {
          this.showExceptionMessageBox(
            "Erro",
            "Erro buscando lista de permissões",
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
          await this.serverService.post("/permissoes/setPermissoes", { list });
          this.showSuccessMessageBox("Gravadas", "Permissões gravadas");
          this.carregaDados();
        } catch (err) {
          this.showExceptionMessageBox("Erro", "Erro ao gravar permissões", err);
        } finally {
          sap.ui.core.BusyIndicator.hide();
        }
      },

    })
);
