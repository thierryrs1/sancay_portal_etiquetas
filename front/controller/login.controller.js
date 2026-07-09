/* eslint-disable no-underscore-dangle */
/* eslint-disable no-undef */
sap.ui.define(
  [
    "sps/wms/controller/BaseController",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sps/wms/base/Validator",
    "sps/wms/base/ServerService",
    "jquery.sap.global"
  ],
  (BaseController, JSONModel, MessageToast, Validator, ServerService) =>
    BaseController.extend("sps.wms.controller.Login", {
      validator: new Validator(),
      serverService: new ServerService(),
      onInit() {
        sessionStorage.setItem("token", "");
        document.title = "Login";
        // Model para controlar os estados da view
        const oViewModel = new JSONModel({
          inputUserState: "None"
        });

        this.setModel(oViewModel, "appView");

        // Cria o model de login para guardar os dados digitados na view

        const oLogin = new JSONModel();
        this.setModel(oLogin, "login");

        this.modelLogin = this.getModel("login");

        // attach handlers for validation errors
        this._attachHandlersValidation();

        // Coloca o foco no campo Usuário
        const oUserInput = this.byId("userInput");
        oUserInput.addEventDelegate({
          onAfterRendering() {
            oUserInput.focus();
          }
        });
        
        // Busca o nome do banco
        this.fetchDbName();
      },

      async fetchDbName() {
        try {
          const dbName = await this.serverService.get("/configSps/getConf/DB_NAME");
          this.getModel("login").setProperty("/DbName", dbName);
        } catch (ex) {
          // ignora se falhar
        }
      },
      /**
       * Confirmação do login
       */
      async onLoginPress() {
        try {
          this.getView().setBusy(true);

          // Campos que serão validados
          const oView = this.getView();

          const aInputs = [
            oView.byId("userInput"),
            oView.byId("passwordInput")
          ];

          const bValidationError = this.validator.validateEmptyFields(aInputs);

          // Se os campos são válidos
          if (bValidationError) {
            MessageToast.show("Informe o Usuário e Senha");
          } else {
            const username = this.byId("userInput").getValue();
            const password = this.byId("passwordInput").getValue();
            sessionStorage.setItem("token", "");
            
            if (username == "ConfigSPS") {
              const check = await this.serverService.post("configSps/checkConfigLogin", { username, password });
              if (check.isConfigLogin) {
                sessionStorage.setItem("token", "config");
                this.getRouter().navTo("configsps");
                return;
              }
            }

            const response = await this.serverService.login({
              username,
              password
            });
            sessionStorage.setItem("token", response.token);
            const cn = await this.serverService.get("/getCompanyName");
            sessionStorage.setItem("companyName", cn);
            const perms = await this.serverService.get("/getPerms");
            sessionStorage.setItem("perms", JSON.stringify(perms));
            this.getRouter().navTo("home");
            
          }
        } catch (err) {
          let message;
          if (err.error === "Unauthorized") {
            message = "Usuário e/ou Senha inválidos";
          } else {
            message = this.getErrorDescription(err);
          }
          MessageToast.show(message, { duration: 6000 });
        } finally {
          this.getView().setBusy(false);
        }
      },

      /**
       * Seta os campos que serão validados
       */
      _attachHandlersValidation() {
        const oView = this.getView();
        sap.ui
          .getCore()
          .getMessageManager()
          .registerObject(oView.byId("userInput"), true);
        sap.ui
          .getCore()
          .getMessageManager()
          .registerObject(oView.byId("passwordInput"), true);
      }
    })
);
