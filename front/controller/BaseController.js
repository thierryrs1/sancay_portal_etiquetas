/* eslint-disable no-restricted-globals */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-shadow */
/* eslint-disable no-param-reassign */
/* eslint-disable array-callback-return */
/* eslint-disable eqeqeq */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
sap.ui.define(
  [
    "sap/ui/core/mvc/Controller",
    "sap/ui/core/routing/History",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sps/wms/base/ServerService",
    "sap/ui/model/resource/ResourceModel"
  ],
  (Controller, History, MessageToast, MessageBox, ServerService, ResourceModel) =>
    Controller.extend("sps.wms.controller.BaseController", {
      prevRoute: null,
      route: null,
      serverService: new ServerService(),
      onInit() {
        if (this.route) {
          this._oRouter = this.getOwnerComponent().getRouter();
          this._oRouter
            .getRoute(this.route)
            .attachPatternMatched(this.baseInitialize, this);
        }
      },
      setModelPage(model, prop, data, page = 0) {
        this.setModelProperty(model, `${prop}Page`, page);
        this.setModelProperty(
          model,
          `${prop}Previous`,
          data ? data.previous : false
        );
        this.setModelProperty(model, `${prop}Next`, data ? data.next : false);

        this.setModelProperty(model, prop, data ? data.value : []);
      },
      getModelPage(model, prop) {
        const data = this.getModelProperty(model, prop);
        const page = this.getModelProperty(model, `${prop}Page`);
        return {
          data,
          page
        };
      },
      nextPage(model, prop) {
        const page = this.getModelProperty(model, `${prop}Page`);
        return page + 1;
      },
      previousPage(model, prop) {
        const page = this.getModelProperty(model, `${prop}Page`);
        return page - 1;
      },
      onSelectAll(oEvent) {
        const isSelected = oEvent.getSource().getSelected();

        const element = oEvent.getSource();

        const model = element.data("model");
        const prop = element.data("prop");
        const key = element.data("key");

        let selecteds = this.getModelProperty(model, `${prop}Selecteds`);

        const items = this.getModelProperty(model, prop);

        items.map(item => {
          if (isSelected) {
            if (!selecteds.find(el => el == item[key])) {
              selecteds.push(item[key]);
            }
          } else {
            selecteds = selecteds.filter(el => el != item[key]);
          }
          item.Selected = isSelected;
        });

        this.setModelProperty(model, prop, items);
        this.setModelProperty(model, `${prop}Selecteds`, selecteds);
      },
      onSelectionData(oEvent) {
        const param = oEvent.getParameters();

        const element = oEvent.getSource();

        const model = element.data("model");
        const prop = element.data("prop");
        const value = element.data("value");

        let selecteds = this.getModelProperty(model, `${prop}Selecteds`);

        if (param.selected) {
          const selItem = selecteds.find(item => item == value);
          if (selItem == undefined) {
            selecteds.push(value);
          }
        } else {
          selecteds = selecteds.filter(item => item != value);
        }

        this.setModelProperty(model, `${prop}Selecteds`, selecteds);
      },
      getSelectionData(model, prop) {
        const response = this.getModelProperty(model, `${prop}Selecteds`);
        return response;
      },
      clearSelectionData(model, prop) {
        this.setModelProperty(model, `${prop}Selecteds`, []);
      },
      applySelections(model, prop, keyField, data) {
        const selections = this.getSelectionData(model, prop);
        let item;
        data.map(d => {
          item = selections.find(item => item == d[keyField]);
          d.Selected = item != undefined;
        });
        return data;
      },
      getErrorDescription(err) {
        if (err.data) {
          if (err.data.responseJSON) {
            return (
              err.data.responseJSON.detail || err.data.responseJSON.message
            );
          }
          return err.error || err.message;
        }
        return err.error || err.message;
      },
      treatError(err) {
        if (err.error == "Unauthorized") {
          this.showToast("Não autorizado");
          this.navTo("login");
        } else {
          const message = this.getErrorDescription(err);
          this.showToast(message);
        }
      },
      onBack() {
        const sPreviousHash = History.getInstance().getPreviousHash();

        if (sPreviousHash !== undefined) {
          window.history.go(-1);
        } else {
        this.getOwnerComponent()
          .getRouter()
          .navTo("home");
        }
      },
      async logout() {
        sessionStorage.setItem("token", "");
        this.navTo("login");
      },
      async onLogout() {
        try {
          this.showQuestion(
            "Sair?",
            "Confirma sair do sistema?",
            this.logout.bind(this)
          );
        } catch (err) {
          MessageToast.show(err.message || err.error);
        }
      },
      navTo(route, data, routeProps) {
        if (data)
          sessionStorage.setItem(`params_${route}`, JSON.stringify(data));

        return new Promise(() => {
          if (routeProps) this.getRouter().navTo(route, routeProps);
          else this.getRouter().navTo(route);
        }).catch(err => {
          if (err !== undefined) {
            MessageToast.show(err.message);
          }
        });
      },
      baseInitialize(oEvent) {
        if (this.checkLogin()) {
          const data = sessionStorage.getItem(`params_${this.route}`);
          // eslint-disable-next-line no-sequences
          this.initialize(data ? JSON.parse(data) : null), oEvent;
          document.title = "Portal de Etiquetas";
        }
      },
      initialize() {},
      getModel(sName) {
        return this.getView().getModel(sName);
      },
      setModel(oModel, sName) {
        return this.getView().setModel(oModel, sName);
      },
      getRouter() {
        return sap.ui.core.UIComponent.getRouterFor(this);
      },
      checkLogin() {
        const token = sessionStorage.getItem("token");
        if (token == "" || token == undefined || token == null) {
          this.getRouter().navTo("login");
          return false;
        }
        return true;
      },
      showToast(message) {
        MessageToast.show(message);
      },
      showQuestion(title, question, callback) {
        MessageBox.show(question, {
          icon: MessageBox.Icon.QUESTION,
          title,
          actions: [MessageBox.Action.YES, MessageBox.Action.NO],
          onClose(oAction) {
            if (oAction === sap.m.MessageBox.Action.YES) {
              callback();
            }
          }
        });
      },
      showErrorMessageBox(title, error) {
        MessageBox.show(error, {
          icon: MessageBox.Icon.ERROR,
          title,
          actions: [MessageBox.Action.CLOSE]
        });
      },
      showSuccessMessageBox(title, message) {
        MessageBox.show(message, {
          icon: MessageBox.Icon.SUCCESS,
          title,
          actions: [MessageBox.Action.CLOSE]
        });
      },
      showExceptionMessageBox(title, text, err) {
        if (err && err.data && err.data.status === 401) {
          sessionStorage.setItem("token", "");
          this.getRouter().navTo("login");
          return;
        }
        let exceptionText = "";
        if (err) {
          if (err.data) {
            if (err.data.responseJSON)
              exceptionText =
                ": " +
                (err.data.responseJSON.detail || err.data.responseJSON.message);
            else exceptionText = ": " + err.error;
          } 
          else 
            exceptionText = ": " + err.message;
        }
        this.showErrorMessageBox(title, text + exceptionText);
      },

      // Seta valor para uma propriedade do model
      setModelValue(self, sModel, sProperty, value) {
        self.getModel(sModel).setProperty(sProperty, value);
      },

      getModelData(modelName) {
        return this.getModel(modelName).getData();
      },
      formatDateToFilter(date) {
        if (date) {
          const d = date.split("-");
          return d.join("");
        }

        return "";
      },
      setModelProperty(modelName, prop, value) {
        const model = this.getModel(modelName);
        model.setProperty(`/${prop}`, value);
      },
      getModelProperty(modelName, prop) {
        const model = this.getModel(modelName);
        return model.getProperty(`/${prop}`);
      },
      setTableAllSelections(oEvent, model, property) {
        const isSelected = oEvent.getSource().getSelected();

        const items = model.getProperty(`/${property}`);

        if (items) {
          items.map(item => {
            item.Selected = isSelected;
          });

          model.setProperty(property, items);
        }
      },
      clone(data) {
        return JSON.parse(JSON.stringify(data));
      },
      getSelectDataFromEventList(oEvent, model, prop) {
        const oBindingContext = oEvent
          .getParameter("listItem")
          .getBindingContext(model);

        const index = oBindingContext.sPath.split("/")[2];

        const data = oBindingContext.getModel().getData();

        return data[prop][index];
      },
      hasTableSelections(modelName, property, field) {
        const model = this.getModel(modelName);

        const list = model.getProperty(`/${property}`);

        if (!list) return false;

        const items = list.filter(item => item[field]);

        return items.length > 0;
      },
      getSelectedItems(model, property, field) {
        const list = this.getModel(model).getProperty(`/${property}`);

        const items = list.filter(item => item[field]);

        return items;
      },
      hasSelections(model, prop) {
        const list = this.getSelectionData(model, prop);
        return list.length > 0;
      },

      onNavBack() {
        const sPreviousHash = History.getInstance().getPreviousHash();
        const oCrossAppNavigator = sap.ushell.Container.getService(
          "CrossApplicationNavigation"
        );

        if (
          sPreviousHash !== undefined ||
          !oCrossAppNavigator.isInitialNavigation()
        ) {
          history.go(-1);
        } else {
          this.getRouter().navTo("master", {}, true);
        }
      }
    })
);
